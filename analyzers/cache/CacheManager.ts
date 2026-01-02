/**
 * Cache Manager
 * Manages analysis result caching for improved performance
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  ICacheManager,
  CacheConfig,
  CacheEntry,
  CacheStats,
  CacheSetOptions,
} from './types';

export class CacheManager implements ICacheManager {
  private config: CacheConfig;
  private stats: CacheStats;

  constructor(config: CacheConfig) {
    this.config = config;
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      entries: 0,
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Create cache directory
    await fs.mkdir(this.config.cacheDir, { recursive: true });

    // Load stats
    await this.loadStats();

    // Clean up expired entries
    await this.cleanup();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const cacheFile = this.getCacheFilePath(key);
      const exists = await this.fileExists(cacheFile);

      if (!exists) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      const content = await fs.readFile(cacheFile, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      // Check expiration
      if (new Date() > new Date(entry.expiresAt)) {
        await this.delete(key);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Check file changes if using file-change invalidation
      if (this.config.invalidationStrategy === 'file-change' && entry.fileHashes) {
        const hasChanged = await this.hasFilesChanged(entry.fileHashes);
        if (hasChanged) {
          await this.delete(key);
          this.stats.misses++;
          this.updateHitRate();
          return null;
        }
      }

      this.stats.hits++;
      this.updateHitRate();
      return entry.data;
    } catch (error) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const ttl = options?.ttl || this.config.ttl;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ttl);

    // Calculate file hashes if files provided
    let fileHashes: Map<string, string> | undefined;
    if (options?.files && this.config.invalidationStrategy === 'file-change') {
      fileHashes = await this.calculateFileHashes(options.files);
    }

    const entry: CacheEntry<T> = {
      key,
      data: value,
      createdAt,
      expiresAt,
      fileHashes: fileHashes ? Object.fromEntries(fileHashes) as any : undefined,
      metadata: options?.metadata,
    };

    const cacheFile = this.getCacheFilePath(key);
    const content = JSON.stringify(entry, null, 2);

    await fs.writeFile(cacheFile, content, 'utf-8');

    // Update stats
    this.stats.entries++;
    this.stats.size += content.length;
    await this.saveStats();

    // Check max size
    if (this.config.maxSize && this.stats.size > this.config.maxSize) {
      await this.evictOldest();
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const cacheFile = this.getCacheFilePath(key);
    return this.fileExists(cacheFile);
  }

  async delete(key: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const cacheFile = this.getCacheFilePath(key);
      const exists = await this.fileExists(cacheFile);

      if (!exists) {
        return false;
      }

      const stat = await fs.stat(cacheFile);
      await fs.unlink(cacheFile);

      this.stats.entries--;
      this.stats.size -= stat.size;
      await this.saveStats();

      return true;
    } catch (error) {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const files = await fs.readdir(this.config.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'stats.json') {
          await fs.unlink(path.join(this.config.cacheDir, file));
        }
      }

      this.stats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        entries: 0,
      };
      await this.saveStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getStats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  async invalidateByFiles(files: string[]): Promise<number> {
    if (!this.config.enabled) {
      return 0;
    }

    let invalidated = 0;
    const cacheFiles = await fs.readdir(this.config.cacheDir);

    for (const cacheFile of cacheFiles) {
      if (!cacheFile.endsWith('.json') || cacheFile === 'stats.json') {
        continue;
      }

      try {
        const content = await fs.readFile(
          path.join(this.config.cacheDir, cacheFile),
          'utf-8'
        );
        const entry: CacheEntry = JSON.parse(content);

        if (entry.fileHashes) {
          const fileHashesMap = new Map(Object.entries(entry.fileHashes));
          for (const file of files) {
            if (fileHashesMap.has(file)) {
              await this.delete(entry.key);
              invalidated++;
              break;
            }
          }
        }
      } catch (error) {
        // Skip invalid cache files
      }
    }

    return invalidated;
  }

  async cleanup(): Promise<number> {
    if (!this.config.enabled) {
      return 0;
    }

    let cleaned = 0;
    const now = new Date();
    const cacheFiles = await fs.readdir(this.config.cacheDir);

    for (const cacheFile of cacheFiles) {
      if (!cacheFile.endsWith('.json') || cacheFile === 'stats.json') {
        continue;
      }

      try {
        const content = await fs.readFile(
          path.join(this.config.cacheDir, cacheFile),
          'utf-8'
        );
        const entry: CacheEntry = JSON.parse(content);

        if (now > new Date(entry.expiresAt)) {
          await this.delete(entry.key);
          cleaned++;
        }
      } catch (error) {
        // Remove invalid cache files
        await fs.unlink(path.join(this.config.cacheDir, cacheFile));
        cleaned++;
      }
    }

    this.stats.lastCleanup = now;
    await this.saveStats();

    return cleaned;
  }

  private getCacheFilePath(key: string): string {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    return path.join(this.config.cacheDir, `${hash}.json`);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async calculateFileHashes(files: string[]): Promise<Map<string, string>> {
    const hashes = new Map<string, string>();

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        hashes.set(file, hash);
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return hashes;
  }

  private async hasFilesChanged(fileHashes: Map<string, string>): Promise<boolean> {
    for (const [file, oldHash] of fileHashes) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const newHash = crypto.createHash('sha256').update(content).digest('hex');
        if (newHash !== oldHash) {
          return true;
        }
      } catch (error) {
        // File doesn't exist anymore, consider it changed
        return true;
      }
    }

    return false;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private async loadStats(): Promise<void> {
    try {
      const statsFile = path.join(this.config.cacheDir, 'stats.json');
      const exists = await this.fileExists(statsFile);

      if (exists) {
        const content = await fs.readFile(statsFile, 'utf-8');
        this.stats = JSON.parse(content);
      }
    } catch (error) {
      // Use default stats
    }
  }

  private async saveStats(): Promise<void> {
    try {
      const statsFile = path.join(this.config.cacheDir, 'stats.json');
      await fs.writeFile(statsFile, JSON.stringify(this.stats, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save cache stats:', error);
    }
  }

  private async evictOldest(): Promise<void> {
    const cacheFiles = await fs.readdir(this.config.cacheDir);
    const entries: Array<{ file: string; createdAt: Date }> = [];

    for (const cacheFile of cacheFiles) {
      if (!cacheFile.endsWith('.json') || cacheFile === 'stats.json') {
        continue;
      }

      try {
        const content = await fs.readFile(
          path.join(this.config.cacheDir, cacheFile),
          'utf-8'
        );
        const entry: CacheEntry = JSON.parse(content);
        entries.push({ file: cacheFile, createdAt: new Date(entry.createdAt) });
      } catch (error) {
        // Skip invalid files
      }
    }

    // Sort by creation date (oldest first)
    entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      await fs.unlink(path.join(this.config.cacheDir, entries[i].file));
      this.stats.entries--;
    }

    // Recalculate size
    this.stats.size = 0;
    const remainingFiles = await fs.readdir(this.config.cacheDir);
    for (const file of remainingFiles) {
      if (file.endsWith('.json') && file !== 'stats.json') {
        const stat = await fs.stat(path.join(this.config.cacheDir, file));
        this.stats.size += stat.size;
      }
    }

    await this.saveStats();
  }
}
