import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { BaseAnalyzer } from '../base';
import { AnalysisConfig } from '../config';
import { AnalysisError } from '../utils/errors';
import {
  ServiceAnalysisReport,
  ServiceInfo,
  IntegrationStatus,
  IntegrationIssue,
  IntegrationSuggestion,
} from './types';

/**
 * Analyzer for service layer integration
 * Detects service files, checks registration, and analyzes usage patterns
 */
export class ServiceIntegrationAnalyzer extends BaseAnalyzer<ServiceAnalysisReport> {
  private program: ts.Program | null = null;
  private typeChecker: ts.TypeChecker | null = null;
  private sourceFiles: Map<string, ts.SourceFile> = new Map();
  private serviceFiles: Map<string, ServiceInfo> = new Map();
  private interfaceFiles: Map<string, string> = new Map();
  private registeredServices: Set<string> = new Set();

  constructor() {
    super('ServiceIntegrationAnalyzer');
  }

  /**
   * Run the service integration analysis
   */
  protected async runAnalysis(config: AnalysisConfig): Promise<ServiceAnalysisReport> {
    this.validateConfig(config);

    // Initialize TypeScript program
    this.initializeProgram(config);

    // Detect service files
    this.detectServiceFiles();

    // Detect interface files
    this.detectInterfaceFiles();

    // Analyze service registration
    this.analyzeServiceRegistration();

    // Analyze service usage
    this.analyzeServiceUsage();

    // Build service info
    const services = Array.from(this.serviceFiles.values());

    // Find unused services
    const unusedServices = services.filter((s) => s.usageCount === 0);

    // Find partially integrated services
    const partiallyIntegrated = services.filter(
      (s) => !s.interface || !s.implementation || !s.isRegistered
    );

    // Detect integration issues
    const integrationIssues = this.detectIntegrationIssues(services);

    // Generate suggestions
    const suggestions = await this.suggestImprovements({
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      services,
      unusedServices,
      partiallyIntegrated,
      integrationIssues,
      suggestions: [],
      totalServices: services.length,
      registeredServices: this.registeredServices.size,
      unusedCount: unusedServices.length,
    });

    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      services,
      unusedServices,
      partiallyIntegrated,
      integrationIssues,
      suggestions,
      totalServices: services.length,
      registeredServices: this.registeredServices.size,
      unusedCount: unusedServices.length,
    };
  }

  /**
   * Initialize TypeScript program and type checker
   */
  private initializeProgram(config: AnalysisConfig): void {
    try {
      // Find tsconfig.json
      const tsconfigPath = this.findTsConfig();

      // Parse tsconfig
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
      if (configFile.error) {
        throw new Error(`Failed to read tsconfig: ${configFile.error.messageText}`);
      }

      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(tsconfigPath)
      );

      // Filter files based on config
      const rootFiles = parsedConfig.fileNames.filter((file) =>
        this.shouldIncludeFile(file, config)
      );

      // Create program
      this.program = ts.createProgram(rootFiles, parsedConfig.options);
      this.typeChecker = this.program.getTypeChecker();

      // Store source files
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

    // Check exclude patterns
    if (config.exclude) {
      for (const pattern of config.exclude) {
        if (normalizedFile.includes(pattern)) {
          return false;
        }
      }
    }

    // Check include patterns
    if (config.include && config.include.length > 0) {
      return config.include.some((pattern) => normalizedFile.includes(pattern));
    }

    return true;
  }

  /**
   * Detect service files in the codebase
   */
  private detectServiceFiles(): void {
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      // Check if file is in services directory or has Service in name
      if (this.isServiceFile(fileName)) {
        const serviceName = this.extractServiceName(fileName);

        this.serviceFiles.set(serviceName, {
          name: serviceName,
          file: fileName,
          interface: null,
          implementation: null,
          usageCount: 0,
          isRegistered: false,
          consumers: [],
        });
      }
    });

    this.logger.info(`Detected ${this.serviceFiles.size} service files`);
  }

  /**
   * Check if file is a service file
   */
  private isServiceFile(fileName: string): boolean {
    const normalized = path.normalize(fileName);

    // Check if in services directory
    if (normalized.includes('/services/') || normalized.includes('\\services\\')) {
      // Exclude interface files and container files
      if (
        normalized.includes('/interfaces/') ||
        normalized.includes('\\interfaces\\') ||
        normalized.includes('Container') ||
        normalized.includes('Registration')
      ) {
        return false;
      }
      return true;
    }

    // Check if filename contains Service
    const basename = path.basename(fileName, path.extname(fileName));
    return basename.includes('Service') && !basename.startsWith('I');
  }

  /**
   * Extract service name from file path
   */
  private extractServiceName(fileName: string): string {
    const basename = path.basename(fileName, path.extname(fileName));

    // Remove common suffixes
    return basename
      .replace(/Service$/, '')
      .replace(/Implementation$/, '')
      .replace(/Impl$/, '');
  }

  /**
   * Detect interface files
   */
  private detectInterfaceFiles(): void {
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      if (this.isInterfaceFile(fileName)) {
        const interfaceName = this.extractInterfaceName(fileName);
        this.interfaceFiles.set(interfaceName, fileName);

        // Try to match with service
        const serviceName = interfaceName.replace(/^I/, '');
        const service = this.serviceFiles.get(serviceName);
        if (service) {
          service.interface = fileName;
        }
      }
    });

    this.logger.info(`Detected ${this.interfaceFiles.size} interface files`);
  }

  /**
   * Check if file is an interface file
   */
  private isInterfaceFile(fileName: string): boolean {
    const normalized = path.normalize(fileName);

    // Check if in interfaces directory
    if (normalized.includes('/interfaces/') || normalized.includes('\\interfaces\\')) {
      return true;
    }

    // Check if filename starts with I
    const basename = path.basename(fileName, path.extname(fileName));
    return basename.startsWith('I') && basename.includes('Service');
  }

  /**
   * Extract interface name from file path
   */
  private extractInterfaceName(fileName: string): string {
    return path.basename(fileName, path.extname(fileName));
  }

  /**
   * Analyze service registration in service container
   */
  private analyzeServiceRegistration(): void {
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      // Look for service registration files
      if (
        fileName.includes('serviceRegistration') ||
        fileName.includes('ServiceContainer') ||
        fileName.includes('service-registration')
      ) {
        this.findServiceRegistrations(sourceFile);
      }
    });

    // Update service info with registration status
    Array.from(this.serviceFiles.values()).forEach((service) => {
      service.isRegistered = this.registeredServices.has(service.name);
    });

    this.logger.info(`Found ${this.registeredServices.size} registered services`);
  }

  /**
   * Find service registrations in source file
   */
  private findServiceRegistrations(sourceFile: ts.SourceFile): void {
    const visit = (node: ts.Node): void => {
      // Look for container.register calls
      if (ts.isCallExpression(node)) {
        const expression = node.expression;

        if (
          ts.isPropertyAccessExpression(expression) &&
          expression.name.text === 'register'
        ) {
          // Extract service name from first argument
          if (node.arguments.length > 0) {
            const firstArg = node.arguments[0];

            if (ts.isStringLiteral(firstArg)) {
              const serviceName = firstArg.text.replace(/Service$/, '');
              this.registeredServices.add(serviceName);
            } else if (ts.isPropertyAccessExpression(firstArg)) {
              // Handle SERVICE_KEYS.SESSION_SERVICE pattern
              const serviceName = firstArg.name.text.replace(/_SERVICE$/, '');
              const normalized = this.normalizeServiceName(serviceName);
              this.registeredServices.add(normalized);
            }
          }
        }
      }

      // Look for registerInstance calls
      if (ts.isCallExpression(node)) {
        const expression = node.expression;

        if (
          ts.isPropertyAccessExpression(expression) &&
          expression.name.text === 'registerInstance'
        ) {
          if (node.arguments.length > 0) {
            const firstArg = node.arguments[0];

            if (ts.isStringLiteral(firstArg)) {
              const serviceName = firstArg.text.replace(/Service$/, '');
              this.registeredServices.add(serviceName);
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * Normalize service name (e.g., SESSION_SERVICE -> Session)
   */
  private normalizeServiceName(name: string): string {
    return name
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Analyze service usage across the codebase
   */
  private analyzeServiceUsage(): void {
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      // Skip service files themselves
      if (this.isServiceFile(fileName) || this.isInterfaceFile(fileName)) {
        return;
      }

      this.findServiceUsages(sourceFile, fileName);
    });

    this.logger.info('Analyzed service usage across codebase');
  }

  /**
   * Find service usages in source file
   */
  private findServiceUsages(sourceFile: ts.SourceFile, fileName: string): void {
    const visit = (node: ts.Node): void => {
      // Look for import declarations
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;

        if (ts.isStringLiteral(moduleSpecifier)) {
          const importPath = moduleSpecifier.text;

          // Check if importing a service
          Array.from(this.serviceFiles.values()).forEach((service) => {
            if (
              importPath.includes(service.name) ||
              importPath.includes(path.basename(service.file, '.ts'))
            ) {
              service.usageCount++;
              if (!service.consumers.includes(fileName)) {
                service.consumers.push(fileName);
              }
            }
          });
        }
      }

      // Look for service instantiation or usage
      if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
        const text = node.getText(sourceFile);

        Array.from(this.serviceFiles.values()).forEach((service) => {
          if (text.includes(service.name + 'Service') || text.includes(service.name)) {
            service.usageCount++;
            if (!service.consumers.includes(fileName)) {
              service.consumers.push(fileName);
            }
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * Check integration status of a service
   */
  checkIntegration(service: ServiceInfo): IntegrationStatus {
    const issues: string[] = [];

    if (!service.interface) {
      issues.push('Missing interface definition');
    }

    if (!service.implementation) {
      issues.push('Missing implementation file');
    }

    if (!service.isRegistered) {
      issues.push('Not registered in service container');
    }

    if (service.usageCount === 0) {
      issues.push('Service is not used anywhere');
    }

    return {
      isUsed: service.usageCount > 0,
      isRegistered: service.isRegistered,
      hasInterface: service.interface !== null,
      hasImplementation: service.implementation !== null,
      issues,
    };
  }

  /**
   * Detect integration issues
   */
  private detectIntegrationIssues(services: ServiceInfo[]): IntegrationIssue[] {
    const issues: IntegrationIssue[] = [];

    for (const service of services) {
      const status = this.checkIntegration(service);

      // Check for missing interface
      if (!status.hasInterface) {
        issues.push({
          service: service.name,
          type: 'missing-interface',
          severity: 'warning',
          message: `Service ${service.name} does not have an interface definition`,
          file: service.file,
        });
      }

      // Check for not registered
      if (!status.isRegistered && status.isUsed) {
        issues.push({
          service: service.name,
          type: 'not-registered',
          severity: 'error',
          message: `Service ${service.name} is used but not registered in container`,
          file: service.file,
        });
      }

      // Check for unused
      if (!status.isUsed && status.isRegistered) {
        issues.push({
          service: service.name,
          type: 'unused',
          severity: 'warning',
          message: `Service ${service.name} is registered but never used`,
          file: service.file,
        });
      }

      // Check for completely unused
      if (!status.isUsed && !status.isRegistered) {
        issues.push({
          service: service.name,
          type: 'unused',
          severity: 'warning',
          message: `Service ${service.name} is neither registered nor used`,
          file: service.file,
        });
      }
    }

    return issues;
  }

  /**
   * Suggest integration improvements
   */
  async suggestImprovements(report: ServiceAnalysisReport): Promise<IntegrationSuggestion[]> {
    const suggestions: IntegrationSuggestion[] = [];

    for (const service of report.services) {
      const status = this.checkIntegration(service);

      // Suggest integration for unregistered services
      if (!status.isRegistered && status.isUsed) {
        suggestions.push({
          service: service.name,
          type: 'integrate',
          reason: 'Service is used but not registered in container',
          steps: [
            `Create interface I${service.name}Service in services/interfaces/`,
            `Register ${service.name}Service in serviceRegistration.ts`,
            `Update consumers to use dependency injection`,
          ],
          priority: 'high',
        });
      }

      // Suggest removal for unused services
      if (!status.isUsed) {
        suggestions.push({
          service: service.name,
          type: 'remove',
          reason: 'Service is not used anywhere in the codebase',
          steps: [
            `Remove ${service.file}`,
            status.isRegistered
              ? `Remove registration from serviceRegistration.ts`
              : 'No registration to remove',
            service.interface ? `Remove interface ${service.interface}` : 'No interface to remove',
          ],
          priority: status.isRegistered ? 'medium' : 'low',
        });
      }

      // Suggest creating interface for services without one
      if (!status.hasInterface && status.isUsed) {
        suggestions.push({
          service: service.name,
          type: 'integrate',
          reason: 'Service lacks interface definition for better abstraction',
          steps: [
            `Create interface I${service.name}Service in services/interfaces/`,
            `Extract public methods to interface`,
            `Update service to implement interface`,
            `Update service registration to use interface type`,
          ],
          priority: 'medium',
        });
      }
    }

    // Suggest merging similar services
    const similarServices = this.findSimilarServices(report.services);
    for (const group of similarServices) {
      if (group.length > 1) {
        suggestions.push({
          service: group.map((s) => s.name).join(', '),
          type: 'merge',
          reason: 'Similar services could be consolidated',
          steps: [
            `Review ${group.map((s) => s.name).join(' and ')} for overlap`,
            'Merge common functionality into single service',
            'Update consumers to use consolidated service',
            'Remove redundant service files',
          ],
          priority: 'low',
        });
      }
    }

    return suggestions;
  }

  /**
   * Find similar services that could be merged
   */
  private findSimilarServices(services: ServiceInfo[]): ServiceInfo[][] {
    const groups: ServiceInfo[][] = [];
    const processed = new Set<string>();

    for (const service of services) {
      if (processed.has(service.name)) continue;

      const similar = [service];
      processed.add(service.name);

      for (const other of services) {
        if (processed.has(other.name)) continue;

        if (this.areServicesSimilar(service, other)) {
          similar.push(other);
          processed.add(other.name);
        }
      }

      if (similar.length > 1) {
        groups.push(similar);
      }
    }

    return groups;
  }

  /**
   * Check if two services are similar
   */
  private areServicesSimilar(service1: ServiceInfo, service2: ServiceInfo): boolean {
    // Simple heuristic: check for common name patterns
    const name1 = service1.name.toLowerCase();
    const name2 = service2.name.toLowerCase();

    // Check for common prefixes
    const commonPrefixes = ['data', 'storage', 'session', 'workout', 'user'];
    for (const prefix of commonPrefixes) {
      if (name1.startsWith(prefix) && name2.startsWith(prefix)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze all services
   */
  async analyzeServices(): Promise<ServiceAnalysisReport> {
    // This is already handled by runAnalysis
    // This method is here to match the interface from design
    return this.runAnalysis({
      include: [],
      exclude: ['node_modules', 'dist', 'build'],
      entryPoints: [],
      deadCode: { enabled: false, checkDynamicImports: false, confidenceThreshold: 'high' },
      unusedImports: { enabled: false, autoFix: false, preserveTypeImports: false },
      duplicates: { enabled: false, minLines: 0, minTokens: 0, similarityThreshold: 0 },
      orphanedFiles: { enabled: false, excludePatterns: [] },
      typeOptimization: { enabled: false, suggestCentralization: false },
      serviceAnalysis: { enabled: true, checkIntegration: true },
      flowValidation: {
        enabled: false,
        enforceReduxPatterns: false,
        enforceServiceLayer: false,
      },
      dependencies: { enabled: false, detectCircular: false, visualize: false },
    });
  }
}
