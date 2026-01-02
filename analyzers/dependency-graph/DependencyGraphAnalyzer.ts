import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { BaseAnalyzer } from '../base';
import { AnalysisConfig } from '../config';
import { AnalysisError } from '../utils/errors';
import {
  DependencyGraphReport,
  DependencyGraph,
  ModuleNode,
  DependencyEdge,
  CircularDependency,
  CouplingReport,
  ModulePair,
  DecouplingSuggestion,
} from './types';

/**
 * Analyzer for dependency graph and module coupling
 * Detects circular dependencies and suggests decoupling strategies
 */
export class DependencyGraphAnalyzer extends BaseAnalyzer<DependencyGraphReport> {
  private program: ts.Program | null = null;
  private sourceFiles: Map<string, ts.SourceFile> = new Map();
  private nodes: Map<string, ModuleNode> = new Map();
  private edges: DependencyEdge[] = [];
  private entryPoints: string[] = [];

  constructor() {
    super('DependencyGraphAnalyzer');
  }

  /**
   * Run the dependency graph analysis
   */
  protected async runAnalysis(config: AnalysisConfig): Promise<DependencyGraphReport> {
    this.validateConfig(config);

    // Initialize TypeScript program
    this.initializeProgram(config);

    // Build dependency graph
    const graph = await this.buildGraph(config);

    // Detect circular dependencies
    const circularDependencies = config.dependencies?.detectCircular
      ? this.detectCircularDependencies()
      : [];

    // Find tight coupling
    const couplingReport = this.findTightCoupling();

    // Generate visualization if requested
    let visualization: string | undefined;
    if (config.dependencies?.visualize) {
      visualization = await this.generateVisualization('svg');
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(graph, circularDependencies, couplingReport);

    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      graph,
      circularDependencies,
      couplingReport,
      visualization,
      metrics,
    };
  }

  /**
   * Initialize TypeScript program
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
   * Build complete dependency graph
   */
  async buildGraph(config?: AnalysisConfig): Promise<DependencyGraph> {
    // Identify entry points
    if (config?.entryPoints) {
      this.entryPoints = config.entryPoints;
    } else {
      this.entryPoints = this.identifyEntryPoints();
    }

    // Build nodes
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      const dependencies = this.extractDependencies(sourceFile, fileName);
      const isEntry = this.entryPoints.some((ep) => fileName.includes(ep));

      this.nodes.set(fileName, {
        path: fileName,
        name: path.basename(fileName, path.extname(fileName)),
        dependencies,
        dependents: [],
        isEntry,
      });
    });

    // Build edges and update dependents
    Array.from(this.nodes.entries()).forEach(([fileName, node]) => {
      node.dependencies.forEach((dep) => {
        // Add edge
        this.edges.push({
          from: fileName,
          to: dep,
          type: 'import',
          isCircular: false,
        });

        // Update dependent
        const depNode = this.nodes.get(dep);
        if (depNode && !depNode.dependents.includes(fileName)) {
          depNode.dependents.push(fileName);
        }
      });
    });

    this.logger.info(`Built dependency graph with ${this.nodes.size} nodes and ${this.edges.length} edges`);

    return {
      nodes: this.nodes,
      edges: this.edges,
      entryPoints: this.entryPoints,
      totalModules: this.nodes.size,
      totalDependencies: this.edges.length,
    };
  }

  /**
   * Identify entry points automatically
   */
  private identifyEntryPoints(): string[] {
    const entryPoints: string[] = [];

    // Look for common entry point patterns
    Array.from(this.sourceFiles.keys()).forEach((fileName) => {
      const basename = path.basename(fileName);

      if (
        basename === 'main.ts' ||
        basename === 'main.tsx' ||
        basename === 'index.ts' ||
        basename === 'index.tsx' ||
        basename === 'App.tsx' ||
        basename === 'app.tsx'
      ) {
        entryPoints.push(fileName);
      }
    });

    return entryPoints;
  }

  /**
   * Extract dependencies from source file
   */
  private extractDependencies(sourceFile: ts.SourceFile, fileName: string): string[] {
    const dependencies: string[] = [];

    const visit = (node: ts.Node): void => {
      // Import declarations
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const resolved = this.resolveImport(moduleSpecifier.text, fileName);
          if (resolved && this.sourceFiles.has(resolved)) {
            dependencies.push(resolved);
          }
        }
      }

      // Dynamic imports
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        if (expression.kind === ts.SyntaxKind.ImportKeyword) {
          if (node.arguments.length > 0) {
            const arg = node.arguments[0];
            if (ts.isStringLiteral(arg)) {
              const resolved = this.resolveImport(arg.text, fileName);
              if (resolved && this.sourceFiles.has(resolved)) {
                dependencies.push(resolved);
              }
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Resolve import path to absolute file path
   */
  private resolveImport(importPath: string, fromFile: string): string | null {
    // Skip external modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('@/')) {
      return null;
    }

    // Handle path aliases (@/)
    if (importPath.startsWith('@/')) {
      importPath = importPath.replace('@/', 'src/');
    }

    // Resolve relative path
    const fromDir = path.dirname(fromFile);
    let resolved = path.resolve(fromDir, importPath);

    // Try adding extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    if (!path.extname(resolved)) {
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (fs.existsSync(withExt)) {
          return path.normalize(withExt);
        }
      }

      // Try index files
      for (const ext of extensions) {
        const indexFile = path.join(resolved, 'index' + ext);
        if (fs.existsSync(indexFile)) {
          return path.normalize(indexFile);
        }
      }
    }

    if (fs.existsSync(resolved)) {
      return path.normalize(resolved);
    }

    return null;
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(): CircularDependency[] {
    const circularDeps: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const moduleNode = this.nodes.get(node);
      if (moduleNode) {
        for (const dep of moduleNode.dependencies) {
          if (!visited.has(dep)) {
            dfs(dep, [...path]);
          } else if (recursionStack.has(dep)) {
            // Found a cycle
            const cycleStart = path.indexOf(dep);
            const cycle = path.slice(cycleStart);
            cycle.push(dep); // Complete the cycle

            // Mark edges as circular
            for (let i = 0; i < cycle.length - 1; i++) {
              const edge = this.edges.find((e) => e.from === cycle[i] && e.to === cycle[i + 1]);
              if (edge) {
                edge.isCircular = true;
              }
            }

            circularDeps.push({
              cycle: cycle.map((f) => path.basename(f)),
              severity: cycle.length <= 3 ? 'critical' : 'warning',
              suggestion: this.suggestCircularFix(cycle),
            });
          }
        }
      }

      recursionStack.delete(node);
    };

    Array.from(this.nodes.keys()).forEach((node) => {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    });

    this.logger.info(`Found ${circularDeps.length} circular dependencies`);
    return circularDeps;
  }

  /**
   * Suggest fix for circular dependency
   */
  private suggestCircularFix(cycle: string[]): string {
    if (cycle.length === 2) {
      return 'Extract common functionality to a third module';
    } else if (cycle.length === 3) {
      return 'Review module responsibilities and consider dependency injection';
    } else {
      return 'Refactor to reduce coupling between modules';
    }
  }

  /**
   * Find tightly coupled modules
   */
  findTightCoupling(): CouplingReport {
    const tightlyCoupled: ModulePair[] = [];
    const threshold = 0.7; // Coupling score threshold

    // Compare each pair of modules
    const nodeArray = Array.from(this.nodes.entries());
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const [path1, node1] = nodeArray[i];
        const [path2, node2] = nodeArray[j];

        const couplingScore = this.calculateCouplingScore(node1, node2);

        if (couplingScore >= threshold) {
          const sharedDeps = this.findSharedDependencies(node1, node2);

          tightlyCoupled.push({
            module1: path.basename(path1),
            module2: path.basename(path2),
            couplingScore,
            sharedDependencies: sharedDeps.map((d) => path.basename(d)),
            reason: this.explainCoupling(node1, node2, sharedDeps),
          });
        }
      }
    }

    // Generate decoupling suggestions
    const suggestions = tightlyCoupled.map((pair) => this.suggestDecoupling(pair));

    // Calculate average and max coupling
    const allScores = tightlyCoupled.map((p) => p.couplingScore);
    const averageCoupling = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
    const maxCoupling = allScores.length > 0 ? Math.max(...allScores) : 0;

    this.logger.info(`Found ${tightlyCoupled.length} tightly coupled module pairs`);

    return {
      tightlyCoupled,
      suggestions,
      averageCoupling,
      maxCoupling,
    };
  }

  /**
   * Calculate coupling score between two modules
   */
  private calculateCouplingScore(node1: ModuleNode, node2: ModuleNode): number {
    let score = 0;

    // Direct dependency
    if (node1.dependencies.includes(node2.path)) score += 0.5;
    if (node2.dependencies.includes(node1.path)) score += 0.5;

    // Shared dependencies
    const sharedDeps = this.findSharedDependencies(node1, node2);
    const totalDeps = new Set([...node1.dependencies, ...node2.dependencies]).size;
    if (totalDeps > 0) {
      score += (sharedDeps.length / totalDeps) * 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Find shared dependencies between two modules
   */
  private findSharedDependencies(node1: ModuleNode, node2: ModuleNode): string[] {
    return node1.dependencies.filter((dep) => node2.dependencies.includes(dep));
  }

  /**
   * Explain why modules are coupled
   */
  private explainCoupling(node1: ModuleNode, node2: ModuleNode, sharedDeps: string[]): string {
    if (node1.dependencies.includes(node2.path) && node2.dependencies.includes(node1.path)) {
      return 'Bidirectional dependency';
    } else if (node1.dependencies.includes(node2.path)) {
      return `${node1.name} depends on ${node2.name}`;
    } else if (node2.dependencies.includes(node1.path)) {
      return `${node2.name} depends on ${node1.name}`;
    } else if (sharedDeps.length > 0) {
      return `Share ${sharedDeps.length} common dependencies`;
    }
    return 'High coupling detected';
  }

  /**
   * Suggest decoupling strategy
   */
  private suggestDecoupling(pair: ModulePair): DecouplingSuggestion {
    const modules = [pair.module1, pair.module2];

    if (pair.reason.includes('Bidirectional')) {
      return {
        modules,
        strategy: 'interface-abstraction',
        steps: [
          'Create interface for shared functionality',
          'Have both modules depend on interface instead of each other',
          'Use dependency injection to provide implementations',
        ],
        priority: 'high',
        estimatedImpact: 'Breaks circular dependency',
      };
    } else if (pair.sharedDependencies.length > 3) {
      return {
        modules,
        strategy: 'extract-common',
        steps: [
          'Extract shared dependencies to common module',
          'Have both modules depend on common module',
          'Reduce direct coupling',
        ],
        priority: 'medium',
        estimatedImpact: 'Reduces shared dependencies',
      };
    } else {
      return {
        modules,
        strategy: 'dependency-injection',
        steps: [
          'Use dependency injection pattern',
          'Pass dependencies through constructor or props',
          'Reduce direct imports',
        ],
        priority: 'low',
        estimatedImpact: 'Improves testability',
      };
    }
  }

  /**
   * Calculate metrics
   */
  private calculateMetrics(
    graph: DependencyGraph,
    circularDeps: CircularDependency[],
    couplingReport: CouplingReport
  ): DependencyGraphReport['metrics'] {
    const dependencyCounts = Array.from(graph.nodes.values()).map((n) => n.dependencies.length);
    const averageDependencies =
      dependencyCounts.length > 0
        ? dependencyCounts.reduce((a, b) => a + b, 0) / dependencyCounts.length
        : 0;
    const maxDependencies = dependencyCounts.length > 0 ? Math.max(...dependencyCounts) : 0;

    return {
      totalModules: graph.totalModules,
      totalDependencies: graph.totalDependencies,
      circularCount: circularDeps.length,
      tightlyCoupledCount: couplingReport.tightlyCoupled.length,
      averageDependencies,
      maxDependencies,
    };
  }

  /**
   * Generate visual graph
   */
  async generateVisualization(format: 'svg' | 'png' | 'html'): Promise<string> {
    // Generate DOT format for Graphviz
    let dot = 'digraph Dependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Add nodes
    Array.from(this.nodes.entries()).forEach(([path, node]) => {
      const label = node.name;
      const color = node.isEntry ? 'lightblue' : 'white';
      dot += `  "${label}" [fillcolor="${color}", style="filled,rounded"];\n`;
    });

    dot += '\n';

    // Add edges
    this.edges.forEach((edge) => {
      const from = path.basename(edge.from, path.extname(edge.from));
      const to = path.basename(edge.to, path.extname(edge.to));
      const color = edge.isCircular ? 'red' : 'black';
      const style = edge.type === 'dynamic' ? 'dashed' : 'solid';
      dot += `  "${from}" -> "${to}" [color="${color}", style="${style}"];\n`;
    });

    dot += '}\n';

    this.logger.info('Generated dependency graph visualization');
    return dot;
  }
}
