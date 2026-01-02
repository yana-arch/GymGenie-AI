import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { BaseAnalyzer } from '../base';
import { AnalysisConfig } from '../config';
import { AnalysisError } from '../utils/errors';
import {
  TypeSystemReport,
  DuplicateType,
  UnusedType,
  TypeConsolidation,
  CentralizationPlan,
  TypeLocation,
  TypeMigration,
  ImportUpdate,
} from './types';

/**
 * Analyzer for TypeScript type system optimization
 * Detects duplicate types, unused types, and suggests consolidation opportunities
 */
export class TypeSystemOptimizer extends BaseAnalyzer<TypeSystemReport> {
  private program: ts.Program | null = null;
  private typeChecker: ts.TypeChecker | null = null;
  private sourceFiles: Map<string, ts.SourceFile> = new Map();
  private typeDefinitions: Map<string, TypeLocation[]> = new Map();
  private typeUsages: Map<string, Set<string>> = new Map();

  constructor() {
    super('TypeSystemOptimizer');
  }

  /**
   * Run the type system analysis
   */
  protected async runAnalysis(config: AnalysisConfig): Promise<TypeSystemReport> {
    this.validateConfig(config);

    // Initialize TypeScript program
    this.initializeProgram(config);

    // Collect all type definitions
    this.collectTypeDefinitions();

    // Analyze type usages
    this.analyzeTypeUsages();

    // Find duplicates
    const duplicateTypes = await this.findDuplicateTypes();

    // Find unused types
    const unusedTypes = await this.findUnusedTypes();

    // Find consolidation opportunities
    const consolidationOpportunities = await this.findConsolidationOpportunities();

    // Suggest centralization
    const centralizationPlan = await this.suggestCentralization();

    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      duplicateTypes,
      unusedTypes,
      consolidationOpportunities,
      centralizationPlan,
      totalTypesAnalyzed: this.typeDefinitions.size,
      duplicateCount: duplicateTypes.length,
      unusedCount: unusedTypes.length,
    };
  }

  /**
   * Initialize TypeScript program and type checker
   */
  private initializeProgram(config: AnalysisConfig): void {
    try {
      // Find tsconfig.json
      const tsconfigPath = this.findTsConfig(config);

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
  private findTsConfig(config: AnalysisConfig): string {
    const possiblePaths = [
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
    ];

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
   * Collect all type definitions from source files
   */
  private collectTypeDefinitions(): void {
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      this.visitNode(sourceFile, fileName);
    });

    this.logger.info(`Collected ${this.typeDefinitions.size} type definitions`);
  }

  /**
   * Visit AST node to collect type definitions
   */
  private visitNode(node: ts.Node, fileName: string): void {
    // Check for type alias declarations
    if (ts.isTypeAliasDeclaration(node)) {
      this.addTypeDefinition(node.name.text, fileName, node);
    }

    // Check for interface declarations
    if (ts.isInterfaceDeclaration(node)) {
      this.addTypeDefinition(node.name.text, fileName, node);
    }

    // Check for enum declarations
    if (ts.isEnumDeclaration(node)) {
      this.addTypeDefinition(node.name.text, fileName, node);
    }

    // Recursively visit children
    ts.forEachChild(node, (child) => this.visitNode(child, fileName));
  }

  /**
   * Add a type definition to the collection
   */
  private addTypeDefinition(
    name: string,
    fileName: string,
    node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration
  ): void {
    const sourceFile = this.sourceFiles.get(fileName);
    if (!sourceFile) return;

    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const isExported = this.isExported(node);

    const location: TypeLocation = {
      file: fileName,
      line: line + 1,
      isExported,
    };

    if (!this.typeDefinitions.has(name)) {
      this.typeDefinitions.set(name, []);
    }

    this.typeDefinitions.get(name)!.push(location);
  }

  /**
   * Check if a node is exported
   */
  private isExported(node: ts.Node): boolean {
    const modifiers = (node as any).modifiers;
    return (
      modifiers?.some(
        (mod: ts.Modifier) =>
          mod.kind === ts.SyntaxKind.ExportKeyword ||
          mod.kind === ts.SyntaxKind.DefaultKeyword
      ) ?? false
    );
  }

  /**
   * Analyze type usages across the codebase
   */
  private analyzeTypeUsages(): void {
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      this.findTypeReferences(sourceFile, fileName);
    });

    this.logger.info(`Analyzed type usages in ${this.sourceFiles.size} files`);
  }

  /**
   * Find type references in a source file
   */
  private findTypeReferences(node: ts.Node, fileName: string): void {
    // Check for type references
    if (ts.isTypeReferenceNode(node)) {
      const typeName = node.typeName.getText();
      if (!this.typeUsages.has(typeName)) {
        this.typeUsages.set(typeName, new Set());
      }
      this.typeUsages.get(typeName)!.add(fileName);
    }

    // Check for import declarations
    if (ts.isImportDeclaration(node)) {
      const importClause = node.importClause;
      if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          const typeName = element.name.text;
          if (!this.typeUsages.has(typeName)) {
            this.typeUsages.set(typeName, new Set());
          }
          this.typeUsages.get(typeName)!.add(fileName);
        }
      }
    }

    // Recursively visit children
    ts.forEachChild(node, (child) => this.findTypeReferences(child, fileName));
  }

  /**
   * Find duplicate type definitions
   */
  async findDuplicateTypes(): Promise<DuplicateType[]> {
    const duplicates: DuplicateType[] = [];

    Array.from(this.typeDefinitions.entries()).forEach(([typeName, locations]) => {
      if (locations.length > 1) {
        // Get type definitions to compare
        const definitions = this.getTypeDefinitionsSync(typeName, locations);

        // Check if definitions are similar
        const canMerge = this.areDefinitionsSimilar(definitions);

        duplicates.push({
          name: typeName,
          locations,
          definition: definitions[0] || '',
          canMerge,
        });
      }
    });

    this.logger.info(`Found ${duplicates.length} duplicate types`);
    return duplicates;
  }

  /**
   * Get type definitions as strings (synchronous version)
   */
  private getTypeDefinitionsSync(
    typeName: string,
    locations: TypeLocation[]
  ): string[] {
    const definitions: string[] = [];

    for (const location of locations) {
      const sourceFile = this.sourceFiles.get(location.file);
      if (!sourceFile) continue;

      // Find the type declaration node
      const typeNode = this.findTypeNode(sourceFile, typeName);
      if (typeNode) {
        definitions.push(typeNode.getText(sourceFile));
      }
    }

    return definitions;
  }

  /**
   * Find type node by name in source file
   */
  private findTypeNode(
    sourceFile: ts.SourceFile,
    typeName: string
  ): ts.TypeAliasDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration | null {
    let result: ts.TypeAliasDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration | null =
      null;

    const visit = (node: ts.Node): void => {
      if (
        (ts.isTypeAliasDeclaration(node) ||
          ts.isInterfaceDeclaration(node) ||
          ts.isEnumDeclaration(node)) &&
        node.name.text === typeName
      ) {
        result = node;
        return;
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return result;
  }

  /**
   * Check if type definitions are similar enough to merge
   */
  private areDefinitionsSimilar(definitions: string[]): boolean {
    if (definitions.length < 2) return false;

    // Simple comparison: check if definitions are identical
    const first = this.normalizeDefinition(definitions[0]);
    return definitions.slice(1).every((def) => this.normalizeDefinition(def) === first);
  }

  /**
   * Normalize type definition for comparison
   */
  private normalizeDefinition(definition: string): string {
    return definition
      .replace(/\s+/g, ' ')
      .replace(/export\s+/g, '')
      .replace(/declare\s+/g, '')
      .trim();
  }

  /**
   * Find unused type exports
   */
  async findUnusedTypes(): Promise<UnusedType[]> {
    const unusedTypes: UnusedType[] = [];

    Array.from(this.typeDefinitions.entries()).forEach(([typeName, locations]) => {
      for (const location of locations) {
        // Only check exported types
        if (!location.isExported) continue;

        // Check if type is used
        const usages = this.typeUsages.get(typeName);
        const isUsed =
          usages &&
          Array.from(usages).some((usageFile) => usageFile !== location.file);

        if (!isUsed) {
          unusedTypes.push({
            name: typeName,
            file: location.file,
            line: location.line,
            isExported: location.isExported,
          });
        }
      }
    });

    this.logger.info(`Found ${unusedTypes.length} unused types`);
    return unusedTypes;
  }

  /**
   * Find type consolidation opportunities
   */
  async findConsolidationOpportunities(): Promise<TypeConsolidation[]> {
    const opportunities: TypeConsolidation[] = [];

    // Group similar types that could be consolidated
    const typeGroups = this.groupSimilarTypes();

    for (const group of typeGroups) {
      if (group.length < 2) continue;

      const affectedFiles = new Set<string>();
      for (const typeName of group) {
        const locations = this.typeDefinitions.get(typeName);
        if (locations) {
          locations.forEach((loc) => affectedFiles.add(loc.file));
        }
      }

      opportunities.push({
        types: group,
        suggestedName: this.suggestConsolidatedName(group),
        targetFile: this.suggestTargetFile(Array.from(affectedFiles)),
        affectedFiles: Array.from(affectedFiles),
      });
    }

    this.logger.info(`Found ${opportunities.length} consolidation opportunities`);
    return opportunities;
  }

  /**
   * Group similar types that could be consolidated
   */
  private groupSimilarTypes(): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    Array.from(this.typeDefinitions.entries()).forEach(([typeName, locations]) => {
      if (processed.has(typeName)) return;

      const similarTypes = [typeName];
      processed.add(typeName);

      // Find types with similar names or definitions
      Array.from(this.typeDefinitions.entries()).forEach(([otherName, otherLocations]) => {
        if (processed.has(otherName)) return;

        if (this.areTypesSimilar(typeName, otherName)) {
          similarTypes.push(otherName);
          processed.add(otherName);
        }
      });

      if (similarTypes.length > 1) {
        groups.push(similarTypes);
      }
    });

    return groups;
  }

  /**
   * Check if two type names are similar
   */
  private areTypesSimilar(name1: string, name2: string): boolean {
    // Simple heuristic: check for common prefixes/suffixes
    const normalized1 = name1.toLowerCase().replace(/props|type|interface/gi, '');
    const normalized2 = name2.toLowerCase().replace(/props|type|interface/gi, '');

    return normalized1 === normalized2;
  }

  /**
   * Suggest a consolidated name for a group of types
   */
  private suggestConsolidatedName(types: string[]): string {
    // Use the shortest name as base
    const shortest = types.reduce((a, b) => (a.length < b.length ? a : b));
    return shortest;
  }

  /**
   * Suggest target file for consolidated types
   */
  private suggestTargetFile(files: string[]): string {
    // Prefer types directory or index files
    const typeFile = files.find((f) => f.includes('/types/'));
    if (typeFile) return typeFile;

    const indexFile = files.find((f) => f.includes('index.ts'));
    if (indexFile) return indexFile;

    // Default to first file
    return files[0] || 'types/index.ts';
  }

  /**
   * Suggest type centralization plan
   */
  async suggestCentralization(): Promise<CentralizationPlan | null> {
    // Find commonly used types
    const commonTypes = this.findCommonTypes();

    if (commonTypes.length === 0) {
      return null;
    }

    // Suggest target file
    const targetFile = 'types/index.ts';

    // Create migrations
    const migrations = this.createMigrations(commonTypes, targetFile);

    return {
      commonTypes,
      targetFile,
      migrations,
    };
  }

  /**
   * Find commonly used types (used in 3+ files)
   */
  private findCommonTypes(): string[] {
    const commonTypes: string[] = [];

    Array.from(this.typeUsages.entries()).forEach(([typeName, usages]) => {
      if (usages.size >= 3) {
        commonTypes.push(typeName);
      }
    });

    return commonTypes;
  }

  /**
   * Create type migrations
   */
  private createMigrations(types: string[], targetFile: string): TypeMigration[] {
    const migrations: TypeMigration[] = [];
    const fileGroups = new Map<string, string[]>();

    // Group types by source file
    for (const typeName of types) {
      const locations = this.typeDefinitions.get(typeName);
      if (!locations || locations.length === 0) continue;

      const sourceFile = locations[0].file;
      if (!fileGroups.has(sourceFile)) {
        fileGroups.set(sourceFile, []);
      }
      fileGroups.get(sourceFile)!.push(typeName);
    }

    // Create migration for each source file
    Array.from(fileGroups.entries()).forEach(([fromFile, typeNames]) => {
      if (fromFile === targetFile) return;

      const updateImports = this.createImportUpdates(fromFile, targetFile, typeNames);

      migrations.push({
        fromFile,
        toFile: targetFile,
        types: typeNames,
        updateImports,
      });
    });

    return migrations;
  }

  /**
   * Create import updates for migration
   */
  private createImportUpdates(
    fromFile: string,
    toFile: string,
    types: string[]
  ): ImportUpdate[] {
    const updates: ImportUpdate[] = [];

    // Find all files that import from the source file
    Array.from(this.sourceFiles.entries()).forEach(([fileName, sourceFile]) => {
      if (fileName === fromFile) return;

      const hasImport = this.hasImportFrom(sourceFile, fromFile);
      if (hasImport) {
        updates.push({
          file: fileName,
          oldImport: fromFile,
          newImport: toFile,
        });
      }
    });

    return updates;
  }

  /**
   * Check if source file has import from target file
   */
  private hasImportFrom(sourceFile: ts.SourceFile, targetFile: string): boolean {
    let hasImport = false;

    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const importPath = moduleSpecifier.text;
          if (importPath.includes(path.basename(targetFile, '.ts'))) {
            hasImport = true;
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return hasImport;
  }
}
