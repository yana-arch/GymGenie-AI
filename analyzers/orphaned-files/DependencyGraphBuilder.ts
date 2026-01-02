import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { DependencyGraph, FileNode, ImportExportInfo, ImportStatement, ExportStatement } from './types';
import { FileType } from '../types';
import { getFiles, isTestFile, getRelativePath } from '../utils/fileUtils';
import { Logger, defaultLogger } from '../utils/logger';

/**
 * Builds dependency graph for the codebase
 */
export class DependencyGraphBuilder {
  private logger: Logger;
  private rootDir: string;
  private tsConfigPath: string | null = null;
  private compilerOptions: ts.CompilerOptions = {};

  constructor(rootDir: string = process.cwd(), logger?: Logger) {
    this.rootDir = rootDir;
    this.logger = logger ?? defaultLogger.child('DependencyGraphBuilder');
    this.loadTsConfig();
  }

  /**
   * Load TypeScript configuration
   */
  private loadTsConfig(): void {
    const tsConfigPath = ts.findConfigFile(this.rootDir, ts.sys.fileExists, 'tsconfig.json');
    
    if (tsConfigPath) {
      this.tsConfigPath = tsConfigPath;
      const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
      
      if (!configFile.error) {
        const parsedConfig = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(tsConfigPath)
        );
        this.compilerOptions = parsedConfig.options;
      }
    }
  }

  /**
   * Build complete dependency graph
   */
  async buildDependencyGraph(
    includePatterns: string[],
    excludePatterns: string[],
    entryPoints: string[]
  ): Promise<DependencyGraph> {
    this.logger.info('Building dependency graph...');

    // Get all files to analyze
    const files = getFiles(this.rootDir, includePatterns, excludePatterns);
    this.logger.info(`Found ${files.length} files to analyze`);

    // Resolve entry points to absolute paths
    const resolvedEntryPoints = this.resolveEntryPoints(entryPoints);
    this.logger.info(`Resolved ${resolvedEntryPoints.length} entry points`);

    // Build graph
    const nodes = new Map<string, FileNode>();
    const edges = new Map<string, Set<string>>();

    for (const file of files) {
      const relativePath = getRelativePath(file, this.rootDir);
      const isEntry = resolvedEntryPoints.includes(file);
      
      // Parse file for imports and exports
      const importExportInfo = this.parseFile(file);
      
      // Determine file type
      const fileType = this.determineFileType(file, importExportInfo);

      // Create node
      const node: FileNode = {
        path: relativePath,
        imports: importExportInfo.imports.map(imp => imp.resolvedPath).filter((p): p is string => p !== null),
        exports: importExportInfo.exports.map(exp => exp.name),
        isEntryPoint: isEntry,
        fileType,
      };

      nodes.set(relativePath, node);

      // Create edges
      if (!edges.has(relativePath)) {
        edges.set(relativePath, new Set());
      }

      for (const importPath of node.imports) {
        edges.get(relativePath)!.add(importPath);
      }
    }

    const graph: DependencyGraph = {
      nodes,
      edges,
      entryPoints: resolvedEntryPoints.map(ep => getRelativePath(ep, this.rootDir)),
    };

    this.logger.info(`Built graph with ${nodes.size} nodes and ${this.countEdges(edges)} edges`);

    return graph;
  }

  /**
   * Parse file for imports and exports
   */
  private parseFile(filePath: string): ImportExportInfo {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: ImportStatement[] = [];
    const exports: ExportStatement[] = [];

    const visit = (node: ts.Node) => {
      // Handle import declarations
      if (ts.isImportDeclaration(node)) {
        const importInfo = this.parseImportDeclaration(node, filePath);
        if (importInfo) {
          imports.push(importInfo);
        }
      }

      // Handle export declarations
      if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
        const exportInfo = this.parseExportDeclaration(node);
        exports.push(...exportInfo);
      }

      // Handle exported functions, classes, variables
      if (this.hasExportModifier(node)) {
        const exportInfo = this.parseExportedNode(node);
        if (exportInfo) {
          exports.push(exportInfo);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return { imports, exports };
  }

  /**
   * Parse import declaration
   */
  private parseImportDeclaration(node: ts.ImportDeclaration, currentFile: string): ImportStatement | null {
    const moduleSpecifier = node.moduleSpecifier;
    
    if (!ts.isStringLiteral(moduleSpecifier)) {
      return null;
    }

    const source = moduleSpecifier.text;
    const resolvedPath = this.resolveImportPath(source, currentFile);
    const isTypeOnly = node.importClause?.isTypeOnly ?? false;

    const specifiers: string[] = [];

    if (node.importClause) {
      // Default import
      if (node.importClause.name) {
        specifiers.push(node.importClause.name.text);
      }

      // Named imports
      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          for (const element of node.importClause.namedBindings.elements) {
            specifiers.push(element.name.text);
          }
        } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          specifiers.push(node.importClause.namedBindings.name.text);
        }
      }
    }

    return {
      source,
      resolvedPath,
      isTypeOnly,
      specifiers,
    };
  }

  /**
   * Parse export declaration
   */
  private parseExportDeclaration(node: ts.ExportDeclaration | ts.ExportAssignment): ExportStatement[] {
    const exports: ExportStatement[] = [];

    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          exports.push({
            name: element.name.text,
            isDefault: false,
            isTypeOnly: node.isTypeOnly,
          });
        }
      }
    } else if (ts.isExportAssignment(node)) {
      exports.push({
        name: 'default',
        isDefault: true,
        isTypeOnly: false,
      });
    }

    return exports;
  }

  /**
   * Parse exported node (function, class, variable)
   */
  private parseExportedNode(node: ts.Node): ExportStatement | null {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return {
        name: node.name.text,
        isDefault: this.hasDefaultModifier(node),
        isTypeOnly: false,
      };
    }

    if (ts.isClassDeclaration(node) && node.name) {
      return {
        name: node.name.text,
        isDefault: this.hasDefaultModifier(node),
        isTypeOnly: false,
      };
    }

    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration && ts.isIdentifier(declaration.name)) {
        return {
          name: declaration.name.text,
          isDefault: false,
          isTypeOnly: false,
        };
      }
    }

    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      return {
        name: node.name.text,
        isDefault: false,
        isTypeOnly: true,
      };
    }

    return null;
  }

  /**
   * Check if node has export modifier
   */
  private hasExportModifier(node: ts.Node): boolean {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    if (!modifiers) return false;
    return modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
  }

  /**
   * Check if node has default modifier
   */
  private hasDefaultModifier(node: ts.Node): boolean {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    if (!modifiers) return false;
    return modifiers.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);
  }

  /**
   * Resolve import path to absolute file path
   */
  private resolveImportPath(importPath: string, currentFile: string): string | null {
    // Skip external modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return null;
    }

    const currentDir = path.dirname(currentFile);
    let resolvedPath: string;

    // Handle relative imports
    if (importPath.startsWith('.')) {
      resolvedPath = path.resolve(currentDir, importPath);
    } else {
      resolvedPath = path.resolve(this.rootDir, importPath);
    }

    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return getRelativePath(fullPath, this.rootDir);
      }
    }

    // Try index files
    for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
      const indexPath = path.join(resolvedPath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return getRelativePath(indexPath, this.rootDir);
      }
    }

    return null;
  }

  /**
   * Resolve entry points to absolute paths
   */
  private resolveEntryPoints(entryPoints: string[]): string[] {
    const resolved: string[] = [];

    for (const entry of entryPoints) {
      const absolutePath = path.isAbsolute(entry) 
        ? entry 
        : path.resolve(this.rootDir, entry);

      if (fs.existsSync(absolutePath)) {
        resolved.push(absolutePath);
      } else {
        this.logger.warn(`Entry point not found: ${entry}`);
      }
    }

    return resolved;
  }

  /**
   * Determine file type based on path and content
   */
  private determineFileType(filePath: string, info: ImportExportInfo): FileType {
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));

    // Test files
    if (isTestFile(filePath)) {
      return 'test';
    }

    // Config files
    if (fileName.includes('config') || fileName.includes('.config.')) {
      return 'config';
    }

    // Type files
    if (fileName.includes('types') || fileName.includes('schema') || 
        info.exports.every(exp => exp.isTypeOnly)) {
      return 'type';
    }

    // Service files
    if (fileName.includes('Service') || fileName.includes('service') || 
        dirName === 'services') {
      return 'service';
    }

    // Component files
    if (fileName.endsWith('.tsx') || dirName === 'components') {
      return 'component';
    }

    // Default to utility
    return 'utility';
  }

  /**
   * Count total edges in graph
   */
  private countEdges(edges: Map<string, Set<string>>): number {
    let count = 0;
    for (const edgeSet of Array.from(edges.values())) {
      count += edgeSet.size;
    }
    return count;
  }
}
