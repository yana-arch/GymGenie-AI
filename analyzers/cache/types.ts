/**
 * Types for Analysis Result Caching
 * Provides caching to improve analysis performance
 */

import type { AnalysisReport } from '../types/AnalysisReport';

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache directory */
  cacheDir: string;
  /** Cache TTL in milliseconds */
  ttl: number;
  /** Enable cache */
  enabled: boolean;
  /** Maximum cache size in bytes */
  maxSize?: number;
  /** Cache invalidation strategy */
  invalidationStrategy: 'ttl' | 'file-change' | 'manual';
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  /** Cache key */
  key: string;
  /** Cached data */
  data: T;
  /** Creation timestamp */
  createdAt: Date;
  /** Expiration timestamp */
  expiresAt: Date;
  /** File hashes for invalidation */
  fileHashes?: Map<string, string>;
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit rate percentage */
  hitRate: number;
  /** Total cache size in bytes */
  size: number;
  /** Number of entries */
  entries: number;
  /** Last cleanup timestamp */
  lastCleanup?: Date;
}

/**
 * Cache manager interface
 */
export interface ICacheManager {
  /**
   * Get cached value
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set cache value
   */
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;

  /**
   * Check if key exists in cache
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete cache entry
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all cache
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Invalidate cache based on file changes
   */
  invalidateByFiles(files: string[]): Promise<number>;

  /**
   * Clean up expired entries
   */
  cleanup(): Promise<number>;
}

/**
 * Options for setting cache
 */
export interface CacheSetOptions {
  /** Custom TTL for this entry */
  ttl?: number;
  /** Files to track for invalidation */
  files?: string[];
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Cache key generator options
 */
export interface CacheKeyOptions {
  /** Project root */
  projectRoot: string;
  /** Analysis configuration */
  config: any;
  /** Additional context */
  context?: Record<string, any>;
}
