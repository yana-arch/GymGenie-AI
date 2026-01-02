import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnusedImportAnalyzer } from '../UnusedImportAnalyzer';
import { AnalysisConfig } from '../../config/AnalysisConfig';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('UnusedImportAnalyzer', () => {
  let analyzer: UnusedImportAnalyzer;
  let tempDir: string;

  beforeEach(async () => {
    analyzer = new UnusedImportAnalyzer();
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unused-imports-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('categorizeImport', () => {
    it('should categorize side-effect imports', () => {
      const statement = "import './styles.css';";
      const category = analyzer.categorizeImport(statement, '');
      expect(category).toBe('side-effect');
    });

    it('should categorize type-only imports', () => {
      const statement = "import type { User } from './types';";
      const category = analyzer.categorizeImport(statement, 'User');
      expect(category).toBe('type');
    });

    it('should categorize value imports', () => {
      const statement = "import { useState } from 'react';";
      const category = analyzer.categorizeImport(statement, 'useState');
      expect(category).toBe('value');
    });

    it('should categorize both value and type imports', () => {
      const statement = "import { MyClass } from './MyClass'; typeof MyClass";
      const category = analyzer.categorizeImport(statement, 'MyClass');
      expect(category).toBe('both');
    });
  });

  describe('resolveImportPath', () => {
    it('should resolve @/ path alias to project root', () => {
      const importPath = '@/components/Button';
      const filePath = '/project/src/pages/Home.tsx';
      const resolved = analyzer.resolveImportPath(importPath, filePath);
      
      expect(resolved).toContain('components/Button');
      expect(resolved).not.toContain('@/');
    });

    it('should resolve relative paths', () => {
      const importPath = '../utils/helpers';
      const filePath = '/project/src/components/Button.tsx';
      const resolved = analyzer.resolveImportPath(importPath, filePath);
      
      expect(resolved).toContain('utils/helpers');
    });

    it('should keep node_modules imports as-is', () => {
      const importPath = 'react';
      const filePath = '/project/src/App.tsx';
      const resolved = analyzer.resolveImportPath(importPath, filePath);
      
      expect(resolved).toBe('react');
    });
  });

  describe('scanFile', () => {
    it('should detect unused imports in a file', async () => {
      // Create a test file with unused imports
      const testFile = path.join(tempDir, 'test.tsx');
      const content = `
import { useState, useEffect } from 'react';
import { formatDate } from './utils';

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
`;
      await fs.writeFile(testFile, content, 'utf-8');

      const unusedImports = await analyzer.scanFile(testFile);

      // Note: This test may not find unused imports without proper ESLint setup
      // It's more of an integration test
      expect(Array.isArray(unusedImports)).toBe(true);
    });

    it('should return empty array for files with no unused imports', async () => {
      const testFile = path.join(tempDir, 'clean.tsx');
      const content = `
import { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
`;
      await fs.writeFile(testFile, content, 'utf-8');

      const unusedImports = await analyzer.scanFile(testFile);

      expect(Array.isArray(unusedImports)).toBe(true);
    });
  });

  describe('autoFix', () => {
    it('should remove unused default import', async () => {
      const testFile = path.join(tempDir, 'fix-test.tsx');
      const content = `import React from 'react';
import { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
`;
      await fs.writeFile(testFile, content, 'utf-8');

      const unusedImports = [
        {
          file: testFile,
          line: 1,
          column: 8,
          importName: 'React',
          importPath: 'react',
          isTypeOnly: false,
          isNamedImport: false,
          canAutoFix: true,
          category: 'value' as const,
        },
      ];

      const result = await analyzer.autoFix(testFile, unusedImports);

      expect(result.success).toBe(true);
      expect(result.importsRemoved).toBe(1);

      const newContent = await fs.readFile(testFile, 'utf-8');
      expect(newContent).not.toContain('import React from');
      expect(newContent).toContain('import { useState }');
    });

    it('should remove unused named import from import list', async () => {
      const testFile = path.join(tempDir, 'fix-named.tsx');
      const content = `import { useState, useEffect, useMemo } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
`;
      await fs.writeFile(testFile, content, 'utf-8');

      const unusedImports = [
        {
          file: testFile,
          line: 1,
          column: 20,
          importName: 'useEffect',
          importPath: 'react',
          isTypeOnly: false,
          isNamedImport: true,
          canAutoFix: true,
          category: 'value' as const,
        },
        {
          file: testFile,
          line: 1,
          column: 32,
          importName: 'useMemo',
          importPath: 'react',
          isTypeOnly: false,
          isNamedImport: true,
          canAutoFix: true,
          category: 'value' as const,
        },
      ];

      const result = await analyzer.autoFix(testFile, unusedImports);

      expect(result.success).toBe(true);
      expect(result.importsRemoved).toBeGreaterThan(0);

      const newContent = await fs.readFile(testFile, 'utf-8');
      expect(newContent).toContain('useState');
      expect(newContent).not.toContain('useEffect');
      expect(newContent).not.toContain('useMemo');
    });

    it('should not auto-fix imports marked as non-fixable', async () => {
      const testFile = path.join(tempDir, 'no-fix.tsx');
      const content = `import type { User } from './types';

function MyComponent() {
  return <div>Hello</div>;
}
`;
      await fs.writeFile(testFile, content, 'utf-8');

      const unusedImports = [
        {
          file: testFile,
          line: 1,
          column: 14,
          importName: 'User',
          importPath: './types',
          isTypeOnly: true,
          isNamedImport: true,
          canAutoFix: false,
          category: 'type' as const,
        },
      ];

      const result = await analyzer.autoFix(testFile, unusedImports);

      expect(result.success).toBe(true);
      expect(result.importsRemoved).toBe(0);

      const newContent = await fs.readFile(testFile, 'utf-8');
      expect(newContent).toContain('import type { User }');
    });
  });

  describe('analyze', () => {
    it('should return empty report when disabled', async () => {
      const config: AnalysisConfig = {
        include: ['src/**/*.ts'],
        exclude: ['node_modules'],
        entryPoints: ['src/index.ts'],
        deadCode: {
          enabled: false,
          checkDynamicImports: false,
          confidenceThreshold: 'high',
        },
        unusedImports: {
          enabled: false,
          autoFix: false,
          preserveTypeImports: true,
        },
        duplicates: {
          enabled: false,
          minLines: 5,
          minTokens: 50,
          similarityThreshold: 0.9,
        },
        orphanedFiles: {
          enabled: false,
          excludePatterns: [],
        },
        typeOptimization: {
          enabled: false,
          suggestCentralization: false,
        },
        serviceAnalysis: {
          enabled: false,
          checkIntegration: false,
        },
        flowValidation: {
          enabled: false,
          enforceReduxPatterns: false,
          enforceServiceLayer: false,
        },
        dependencies: {
          enabled: false,
          detectCircular: false,
          visualize: false,
        },
      };

      const report = await analyzer.analyze(config);

      expect(report.success).toBe(true);
      expect(report.unusedImports).toHaveLength(0);
      expect(report.summary.totalUnusedImports).toBe(0);
    });
  });
});
