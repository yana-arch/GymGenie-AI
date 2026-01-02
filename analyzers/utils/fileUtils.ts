import * as fs from 'fs';
import * as path from 'path';
import { FileSystemError } from './errors';

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Read file content safely
 */
export function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new FileSystemError(
      `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      'read'
    );
  }
}

/**
 * Write file content safely
 */
export function writeFile(filePath: string, content: string): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    throw new FileSystemError(
      `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      'write'
    );
  }
}

/**
 * Delete file safely
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    throw new FileSystemError(
      `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      'delete'
    );
  }
}

/**
 * Get all files matching patterns
 */
export function getFiles(
  dir: string,
  patterns: string[] = ['**/*.ts', '**/*.tsx'],
  excludePatterns: string[] = ['node_modules/**', 'dist/**']
): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath);

      // Check if path matches exclude patterns
      if (excludePatterns.some(pattern => matchPattern(relativePath, pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Check if file matches include patterns
        if (patterns.some(pattern => matchPattern(relativePath, pattern))) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Simple glob pattern matching
 */
function matchPattern(filePath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath.replace(/\\/g, '/'));
}

/**
 * Ensure directory exists
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get file extension
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * Check if path is TypeScript file
 */
export function isTypeScriptFile(filePath: string): boolean {
  const ext = getExtension(filePath);
  return ext === '.ts' || ext === '.tsx';
}

/**
 * Check if path is test file
 */
export function isTestFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return fileName.includes('.test.') || fileName.includes('.spec.');
}

/**
 * Get relative path from project root
 */
export function getRelativePath(filePath: string, rootDir: string = process.cwd()): string {
  return path.relative(rootDir, filePath);
}
