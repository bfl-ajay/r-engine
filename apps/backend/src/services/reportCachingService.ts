/**
 * Report Caching Service
 * Manages caching of rendered reports and query results
 */

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
  size: number; // Bytes
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  averageHits: number;
}

export interface CachePolicy {
  enabled: boolean;
  ttl: number; // milliseconds
  maxSize: number; // bytes
  maxEntries: number;
  strategy: 'LRU' | 'LFU' | 'FIFO';
}

/**
 * ReportCachingService - Manage report and query caching
 */
class ReportCachingService {
  private cache: Map<string, CacheEntry> = new Map();
  private policy: CachePolicy = {
    enabled: true,
    ttl: 1000 * 60 * 5, // 5 minutes default
    maxSize: 1000 * 1024 * 100, // 100MB
    maxEntries: 1000,
    strategy: 'LRU',
  };
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Get from cache
   */
  get<T = any>(key: string): T | null {
    if (!this.policy.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count and timestamp (for LRU/LFU)
    entry.hits++;
    this.stats.hits++;

    return entry.value as T;
  }

  /**
   * Set cache entry
   */
  set<T = any>(key: string, value: T, ttl?: number): void {
    if (!this.policy.enabled) return;

    // Calculate size (rough estimate)
    const size = this.estimateSize(value);

    // Check capacity
    if (this.getTotalSize() + size > this.policy.maxSize) {
      this.evict();
    }

    if (this.cache.size >= this.policy.maxEntries) {
      this.evict();
    }

    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.policy.ttl,
      hits: 0,
      size,
    };

    this.cache.set(key, entry);
  }

  /**
   * Remove from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Evict entries based on policy strategy
   */
  private evict(): void {
    if (this.cache.size === 0) return;

    let toRemove: string | null = null;

    switch (this.policy.strategy) {
      case 'LRU': // Least Recently Used
        toRemove = this.findLRUEntry();
        break;
      case 'LFU': // Least Frequently Used
        toRemove = this.findLFUEntry();
        break;
      case 'FIFO': // First In First Out
        toRemove = this.findFIFOEntry();
        break;
    }

    if (toRemove) {
      this.cache.delete(toRemove);
    }
  }

  /**
   * Find LRU entry
   */
  private findLRUEntry(): string | null {
    let oldest: [string, CacheEntry] | null = null;

    this.cache.forEach((entry, key) => {
      if (!oldest || entry.timestamp < oldest[1].timestamp) {
        oldest = [key, entry];
      }
    });

    return oldest ? oldest[0] : null;
  }

  /**
   * Find LFU entry
   */
  private findLFUEntry(): string | null {
    let leastUsed: [string, CacheEntry] | null = null;

    this.cache.forEach((entry, key) => {
      if (!leastUsed || entry.hits < leastUsed[1].hits) {
        leastUsed = [key, entry];
      }
    });

    return leastUsed ? leastUsed[0] : null;
  }

  /**
   * Find FIFO entry (oldest)
   */
  private findFIFOEntry(): string | null {
    let oldest: [string, CacheEntry] | null = null;

    this.cache.forEach((entry, key) => {
      if (!oldest || entry.timestamp < oldest[1].timestamp) {
        oldest = [key, entry];
      }
    });

    return oldest ? oldest[0] : null;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalHits = this.stats.hits;
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      totalEntries: this.cache.size,
      totalSize: this.getTotalSize(),
      hitRate: hitRate * 100,
      missRate: (1 - hitRate) * 100,
      averageHits: totalHits > 0 ? totalHits / this.cache.size : 0,
    };
  }

  /**
   * Get total cache size
   */
  getTotalSize(): number {
    let total = 0;
    this.cache.forEach((entry) => {
      total += entry.size;
    });
    return total;
  }

  /**
   * Get cache entry details
   */
  getEntry(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  /**
   * List all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * List cache entries sorted by hits
   */
  getEntriesSortedByHits(): CacheEntry[] {
    return Array.from(this.cache.values()).sort((a, b) => b.hits - a.hits);
  }

  /**
   * List cache entries sorted by size
   */
  getEntriesSortedBySize(): CacheEntry[] {
    return Array.from(this.cache.values()).sort((a, b) => b.size - a.size);
  }

  /**
   * Set cache policy
   */
  setPolicy(policy: Partial<CachePolicy>): void {
    this.policy = { ...this.policy, ...policy };
  }

  /**
   * Get cache policy
   */
  getPolicy(): CachePolicy {
    return { ...this.policy };
  }

  /**
   * Warm cache with data
   */
  warmCache<T = any>(
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): void {
    entries.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * Create cache key from report params
   */
  createReportCacheKey(
    reportId: string,
    parameters: Record<string, any>,
    format?: string
  ): string {
    const paramString = JSON.stringify(parameters);
    const paramHash = this.simpleHash(paramString);
    return `report:${reportId}:${paramHash}${format ? `:${format}` : ''}`;
  }

  /**
   * Create cache key from query
   */
  createQueryCacheKey(
    connectionId: string,
    queryText: string,
    parameters?: Record<string, any>
  ): string {
    const paramString = parameters ? JSON.stringify(parameters) : '';
    const fullQuery = queryText + paramString;
    const queryHash = this.simpleHash(fullQuery);
    return `query:${connectionId}:${queryHash}`;
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(pattern: string): number {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Estimate object size
   */
  private estimateSize(obj: any): number {
    try {
      return JSON.stringify(obj).length * 2; // Rough estimate (2 bytes per char)
    } catch {
      return 1000; // Default if stringify fails
    }
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get cache memory usage in MB
   */
  getMemoryUsage(): number {
    return this.getTotalSize() / (1024 * 1024);
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const before = this.cache.size;
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });

    return before - this.cache.size;
  }

  /**
   * Export cache contents
   */
  export(): Record<string, any> {
    const exported: Record<string, any> = {};

    this.cache.forEach((entry, key) => {
      exported[key] = {
        value: entry.value,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        hits: entry.hits,
      };
    });

    return exported;
  }

  /**
   * Import cache contents
   */
  import(data: Record<string, any>): void {
    Object.entries(data).forEach(([key, entryData]) => {
      this.set(key, entryData.value, entryData.ttl);
    });
  }

  /**
   * Generate cache report
   */
  generateReport(): {
    stats: CacheStats;
    policy: CachePolicy;
    topEntries: CacheEntry[];
    largestEntries: CacheEntry[];
  } {
    return {
      stats: this.getStats(),
      policy: this.getPolicy(),
      topEntries: this.getEntriesSortedByHits().slice(0, 10),
      largestEntries: this.getEntriesSortedBySize().slice(0, 10),
    };
  }
}

export default new ReportCachingService();
