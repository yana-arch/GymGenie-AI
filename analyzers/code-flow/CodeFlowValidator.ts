import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { BaseAnalyzer } from '../base';
import { AnalysisConfig } from '../config';
import { AnalysisError } from '../utils/errors';
import {
  CodeFlowReport,
  DataFlowTrace,
  StateAccess,
  ServiceCall,
  StorageAccess,
  FlowViolation,
  PatternViolation,
  ServiceLayerViolation,
} from './types';

/**
 * Validator for code flow patterns
 * Ensures proper data flow from UI → Services → State → Storage
 */
export class CodeFlowValidator extends BaseAnalyzer<CodeFlowReport> {
  private program: ts.Program | null = null;
  private typeChecker: ts.TypeChecker | null = null;
  private sourceFiles: Map<string, ts.SourceFile> = new Map();
  private componentFiles: Map<string, ts.SourceFile> = new Map();
  private traces: DataFlowTrace[] = [];
  private patternViolations: PatternViolation[] = [];
  private serviceLayerViolations: ServiceLayerViolation[] = [];

  constructor() {
    super('CodeFlowValidator');
  }

  /**
   * Run the code flow validation
   */
  protected async runAnalysis(config: AnalysisConfig): Promise<CodeFlowReport> {
    this.validateConfig(config);

    // Initialize TypeScript program
    this.initializeProgram(config);

    // Identify component files
    this.identifyComponents();

    // Trace data flow for each component
    for (const [fileName, sourceFile] of this.componentFiles.entries()) {
      const componentName = this.extractComponentName(fileName);
      const trace = this.traceDataFlow(componentName, sourceFile, fileName);
      this.traces.push(trace);
    }

    // Validate Redux patterns
    if (config.flowValidation?.enforceReduxPatterns) {
      this.patternViolations.push(...this.validateReduxPatterns());
    }

    // Validate service layer usage
    if (config.flowValidation?.enforceServiceLayer) {
      this.serviceLayerViolations.push(...this.validateServiceLayerUsage());
    }

    // Count violations
    const componentsWithViolations = this.traces.filter((t) => t.violations.length > 0).length;
    const totalViolations =
      this.traces.reduce((sum, t) => sum + t.violations.length, 0) +
      this.patternViolations.length +
      this.serviceLayerViolations.length;
    const criticalViolations =
      this.traces.reduce((sum, t) => sum + t.violations.filter((v) => v.severity === 'error').length, 0) +
      this.patternViolations.filter((v) => v.severity === 'error').length +
      this.serviceLayerViolations.filter((v) => v.severity === 'error').length;

    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      traces: this.traces,
      patternViolations: this.patternViolations,
      serviceLayerViolations: this.serviceLayerViolations,
      totalComponents: this.componentFiles.size,
      componentsWithViolations,
      totalViolations,
      criticalViolations,
    };
  }

  /**
   * Initialize TypeScript program and type checker
   */
  private initializeProgram(config: AnalysisConfig): void {
    try {
      const tsconfigPath = this.findTsConfig();
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

      if (configFile.error) {
        throw new Error(`Failed to read tsconfig: ${configFile.error.messageText}`);
      }

      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(tsconfigPath)
      );

      const rootFiles = parsedConfig.fileNames.filter((file) =>
        this.shouldIncludeFile(file, config)
      );

      this.program = ts.createProgram(rootFiles, parsedConfig.options);
      this.typeChecker = this.program.getTypeChecker();

      for (const sourceFile of this.program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile && this.shouldIncludeFile(sourceFile.fileName, config)) {
          this.sourceFiles.set(sourceFile.fileName, sourceFile);
        }
      }

      this.logger.info(`Initialized TypeScript program with ${this.sourceFiles.size} files`);
    } catch (error) {
      throw new AnalysisError(
        `Failed to initialize TypeScript program: ${error instanceof Error ? error.message : String(error)}`,
        this.name
      );
    }
  }

  /**
   * Find tsconfig.json file
   */
  private findTsConfig(): string {
    const possiblePaths = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    throw new Error('tsconfig.json not found');
  }

  /**
   * Check if file should be included in analysis
   */
  private shouldIncludeFile(file: string, config: AnalysisConfig): boolean {
    const normalizedFile = path.normalize(file);

    if (config.exclude) {
      for (const pattern of config.exclude) {
        if (normalizedFile.includes(pattern)) {
          return false;
        }
      }
    }

    if (config.include && config.include.length > 0) {
      return config.include.some((pattern) => normalizedFile.includes(pattern));
    }

    return true;
  }

  /**
   * Identify React component files
   */
  private identifyComponents(): void {
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      if (this.isComponentFile(fileName, sourceFile)) {
        this.componentFiles.set(fileName, sourceFile);
      }
    });

    this.logger.info(`Identified ${this.componentFiles.size} component files`);
  }

  /**
   * Check if file is a React component
   */
  private isComponentFile(fileName: string, sourceFile: ts.SourceFile): boolean {
    // Check file extension
    if (!fileName.endsWith('.tsx') && !fileName.endsWith('.jsx')) {
      return false;
    }

    // Check for React imports
    let hasReactImport = false;
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === 'react') {
          hasReactImport = true;
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return hasReactImport;
  }

  /**
   * Extract component name from file path
   */
  private extractComponentName(fileName: string): string {
    return path.basename(fileName, path.extname(fileName));
  }

  /**
   * Trace data flow from UI component to services
   */
  traceDataFlow(component: string, sourceFile: ts.SourceFile, fileName: string): DataFlowTrace {
    const stateAccess: StateAccess[] = [];
    const serviceCall: ServiceCall[] = [];
    const directStorageAccess: StorageAccess[] = [];
    const violations: FlowViolation[] = [];

    const visit = (node: ts.Node): void => {
      // Check for Redux hooks (useSelector, useDispatch)
      if (ts.isCallExpression(node)) {
        const expression = node.expression;

        if (ts.isIdentifier(expression)) {
          const name = expression.text;

          // useSelector
          if (name === 'useSelector') {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            stateAccess.push({
              selector: node.getText(sourceFile).substring(0, 50),
              slice: 'unknown',
              isProperlyTyped: this.isProperlyTyped(node),
              location: fileName,
              line: line + 1,
            });
          }

          // useDispatch
          if (name === 'useDispatch') {
            // Check if dispatch is used properly
            const parent = node.parent;
            if (parent && ts.isVariableDeclaration(parent)) {
              // This is fine - const dispatch = useDispatch()
            }
          }

          // Direct localStorage/sessionStorage access
          if (name === 'localStorage' || name === 'sessionStorage') {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            directStorageAccess.push({
              key: 'unknown',
              operation: 'read',
              location: fileName,
              line: line + 1,
              isDirect: true,
            });

            violations.push({
              type: 'direct-storage-access',
              location: fileName,
              line: line + 1,
              severity: 'warning',
              suggestion: 'Use StorageService instead of direct localStorage access',
              component,
            });
          }
        }

        // Check for property access (e.g., localStorage.getItem)
        if (ts.isPropertyAccessExpression(expression)) {
          const objectName = expression.expression.getText(sourceFile);

          if (objectName === 'localStorage' || objectName === 'sessionStorage') {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const methodName = expression.name.text;
            const operation = methodName === 'getItem' ? 'read' : methodName === 'setItem' ? 'write' : 'delete';

            directStorageAccess.push({
              key: 'unknown',
              operation,
              location: fileName,
              line: line + 1,
              isDirect: true,
            });

            violations.push({
              type: 'direct-storage-access',
              location: fileName,
              line: line + 1,
              severity: 'warning',
              suggestion: 'Use StorageService instead of direct storage access',
              component,
            });
          }
        }
      }

      // Check for direct state mutation
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const left = node.left;
        if (ts.isPropertyAccessExpression(left)) {
          const text = left.getText(sourceFile);
          if (text.includes('state.') || text.includes('.current.')) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              type: 'direct-state-mutation',
              location: fileName,
              line: line + 1,
              severity: 'error',
              suggestion: 'Use Redux actions to update state instead of direct mutation',
              component,
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      component,
      file: fileName,
      stateAccess,
      serviceCall,
      directStorageAccess,
      violations,
    };
  }

  /**
   * Check if node is properly typed
   */
  private isProperlyTyped(node: ts.Node): boolean {
    if (!this.typeChecker) return false;

    try {
      const type = this.typeChecker.getTypeAtLocation(node);
      return type !== undefined && (type.flags & ts.TypeFlags.Any) === 0;
    } catch {
      return false;
    }
  }

  /**
   * Validate Redux patterns are followed
   */
  validateReduxPatterns(): PatternViolation[] {
    const violations: PatternViolation[] = [];

    for (const [fileName, sourceFile] of this.componentFiles.entries()) {
      const visit = (node: ts.Node): void => {
        // Check for direct state mutation
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          const left = node.left;
          if (ts.isPropertyAccessExpression(left)) {
            const text = left.getText(sourceFile);
            if (text.includes('state.')) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                pattern: 'redux',
                location: fileName,
                line: line + 1,
                description: 'Direct state mutation detected',
                suggestion: 'Use Redux actions and reducers to update state',
                severity: 'error',
              });
            }
          }
        }

        // Check for improper dispatch usage
        if (ts.isCallExpression(node)) {
          const expression = node.expression;
          if (ts.isIdentifier(expression) && expression.text === 'dispatch') {
            // Check if dispatching a plain object instead of action
            if (node.arguments.length > 0) {
              const arg = node.arguments[0];
              if (ts.isObjectLiteralExpression(arg)) {
                const hasType = arg.properties.some(
                  (prop) =>
                    ts.isPropertyAssignment(prop) &&
                    ts.isIdentifier(prop.name) &&
                    prop.name.text === 'type'
                );

                if (!hasType) {
                  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                  violations.push({
                    pattern: 'redux',
                    location: fileName,
                    line: line + 1,
                    description: 'Dispatching object without type property',
                    suggestion: 'Use action creators or ensure action has type property',
                    severity: 'warning',
                  });
                }
              }
            }
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    this.logger.info(`Found ${violations.length} Redux pattern violations`);
    return violations;
  }

  /**
   * Validate service layer usage
   */
  validateServiceLayerUsage(): ServiceLayerViolation[] {
    const violations: ServiceLayerViolation[] = [];

    for (const [fileName, sourceFile] of this.componentFiles.entries()) {
      const componentName = this.extractComponentName(fileName);

      const visit = (node: ts.Node): void => {
        // Check for direct API calls (fetch, axios)
        if (ts.isCallExpression(node)) {
          const expression = node.expression;

          if (ts.isIdentifier(expression)) {
            const name = expression.text;

            if (name === 'fetch') {
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                component: componentName,
                file: fileName,
                line: line + 1,
                violation: 'Direct fetch call in component',
                suggestion: 'Move API calls to service layer',
                severity: 'warning',
              });
            }
          }

          // Check for axios calls
          if (ts.isPropertyAccessExpression(expression)) {
            const objectName = expression.expression.getText(sourceFile);
            if (objectName === 'axios') {
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                component: componentName,
                file: fileName,
                line: line + 1,
                violation: 'Direct axios call in component',
                suggestion: 'Move API calls to service layer',
                severity: 'warning',
              });
            }
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    this.logger.info(`Found ${violations.length} service layer violations`);
    return violations;
  }
}
