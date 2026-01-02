# Cache Manager

Provides caching functionality for analysis results to improve performance and reduce redundant computations.

## Features

- **File-based caching**: Stores analysis results on disk
- **TTL-based expiration**: Automatic cache invalidation after specified time
- **File-change detection**: Invalidates cache when source files change
- **Size management**: Automatic eviction when cache size exceeds limit
- **Statistics tracking**: Monitors cache hits, misses, and hit rate
- **Incremental analysis**: Only re-analyze changed files

## Usage

```typescript
import { CacheManager } from "./analyzers/cache";
import type { CacheConfig } from "./analyzers/cache";

// Configure cache
const config: CacheConfig = {
  cacheDir: ".cache/analysis",
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  enabled: true,
  maxSize: 100 * 1024 * 1024, // 100 MB
  invalidationStrategy: "file-change",
};

// Initialize cache manager
const cache = new CacheManager(config);
await cache.initialize();

// Cache analysis results
const analysisKey = "dead-code-analysis";
const cachedResult = await cache.get(analysisKey);

if (cachedResult) {
  console.log("Using cached result");
  return cachedResult;
}

// Perform analysis
const result = await performAnalysis();

// Cache the result
await cache.set(analysisKey, result, {
  files: ["src/**/*.ts"], // Track these files for invalidation
  metadata: { version: "1.0.0" },
});
```

## Configuration

```typescript
interface CacheConfig {
  cacheDir: string; // Cache directory path
  ttl: number; // Time-to-live in milliseconds
  enabled: boolean; // Enable/disable caching
  maxSize?: number; // Maximum cache size in bytes
  invalidationStrategy: "ttl" | "file-change" | "manual";
}
```

### Invalidation Strategies

1. **TTL (Time-To-Live)**

   - Cache expires after specified time
   - Simple and predictable
   - Good for stable codebases

2. **File-Change**

   - Cache invalidates when tracked files change
   - More accurate but requires file tracking
   - Best for active development

3. **Manual**
   - Cache never expires automatically
   - Full control over invalidation
   - Useful for specific scenarios

## API

### get<T>(key: string): Promise<T | null>

Retrieves cached value by key.

```typescript
const result = await cache.get<AnalysisReport>("analysis-report");
if (result) {
  console.log("Cache hit!");
}
```

### set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>

Stores value in cache.

```typescript
await cache.set("analysis-report", report, {
  ttl: 3600000, // 1 hour
  files: ["src/**/*.ts"],
  metadata: { timestamp: Date.now() },
});
```

### has(key: string): Promise<boolean>

Checks if key exists in cache.

```typescript
if (await cache.has("analysis-report")) {
  console.log("Cache entry exists");
}
```

### delete(key: string): Promise<boolean>

Deletes cache entry.

```typescript
await cache.delete("analysis-report");
```

### clear(): Promise<void>

Clears all cache entries.

```typescript
await cache.clear();
```

### getStats(): Promise<CacheStats>

Gets cache statistics.

```typescript
const stats = await cache.getStats();
console.log(`Hit rate: ${stats.hitRate.toFixed(2)}%`);
console.log(`Cache size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
```

### invalidateByFiles(files: string[]): Promise<number>

Invalidates cache entries that track specified files.

```typescript
const invalidated = await cache.invalidateByFiles(["src/utils/helper.ts"]);
console.log(`Invalidated ${invalidated} entries`);
```

### cleanup(): Promise<number>

Removes expired cache entries.

```typescript
const cleaned = await cache.cleanup();
console.log(`Cleaned up ${cleaned} expired entries`);
```

## Integration with Analysis Pipeline

```typescript
import { AnalysisPipeline } from "./analyzers/pipeline";
import { CacheManager } from "./analyzers/cache";

const cache = new CacheManager({
  cacheDir: ".cache/analysis",
  ttl: 24 * 60 * 60 * 1000,
  enabled: true,
  invalidationStrategy: "file-change",
});

await cache.initialize();

// Check cache before running analysis
const cacheKey = "full-analysis";
let report = await cache.get(cacheKey);

if (!report) {
  // Run analysis
  const pipeline = new AnalysisPipeline();
  const result = await pipeline.execute({ config, parallel: true });
  report = result.report;

  // Cache the result
  await cache.set(cacheKey, report, {
    files: ["src/**/*.ts", "src/**/*.tsx"],
  });
}

// Use the report
console.log("Analysis report:", report);
```

## Cache Statistics

```typescript
const stats = await cache.getStats();

console.log("Cache Statistics:");
console.log(`  Hits: ${stats.hits}`);
console.log(`  Misses: ${stats.misses}`);
console.log(`  Hit Rate: ${stats.hitRate.toFixed(2)}%`);
console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Entries: ${stats.entries}`);
console.log(`  Last Cleanup: ${stats.lastCleanup?.toISOString()}`);
```

## Best Practices

1. **Use appropriate TTL**: Balance freshness vs performance
2. **Track relevant files**: Only track files that affect analysis
3. **Monitor hit rate**: Aim for >70% hit rate
4. **Regular cleanup**: Run cleanup periodically
5. **Size limits**: Set maxSize to prevent disk space issues

## Performance Impact

### Without Cache

```
Analysis time: 45 seconds
```

### With Cache (hit)

```
Analysis time: 0.5 seconds
Speedup: 90x faster
```

### With Cache (miss)

```
Analysis time: 45 seconds + 0.1 seconds (cache write)
Overhead: ~0.2%
```

## Troubleshooting

### Cache not working

```typescript
// Check if cache is enabled
const stats = await cache.getStats();
console.log("Cache enabled:", config.enabled);

// Verify cache directory exists
const fs = require("fs");
console.log("Cache dir exists:", fs.existsSync(config.cacheDir));
```

### Low hit rate

- Increase TTL
- Use file-change invalidation
- Check if files are changing frequently
- Verify cache keys are consistent

### Cache size growing

- Reduce TTL
- Set maxSize limit
- Run cleanup more frequently
- Clear old entries manually

## Example: Incremental Analysis

```typescript
// Get list of changed files
const changedFiles = await getChangedFiles();

// Invalidate cache for changed files
await cache.invalidateByFiles(changedFiles);

// Run analysis (will use cache for unchanged parts)
const result = await runAnalysis();
```

## Maintenance

```bash
# Clear cache
npm run cache:clear

# View cache stats
npm run cache:stats

# Cleanup expired entries
npm run cache:cleanup
```

Add to package.json:

```json
{
  "scripts": {
    "cache:clear": "rm -rf .cache/analysis",
    "cache:stats": "tsx scripts/cache-stats.ts",
    "cache:cleanup": "tsx scripts/cache-cleanup.ts"
  }
}
```
