import type { KVNamespace } from "@cloudflare/workers-types";

export class CacheService {
  private kv: KVNamespace | undefined;
  private defaultTTL: number;

  constructor(kv: KVNamespace | undefined, defaultTTL: number = 300) { // 5 minutes default
    this.kv = kv;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate a cache key with optional prefix
   */
  private generateKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    try {
      if (!this.kv) {
        return null; // Cache not available, skip
      }
      const cacheKey = this.generateKey(key, prefix);
      const cached = await this.kv.get(cacheKey, "json");
      return cached as T | null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(
    key: string, 
    value: T, 
    ttl?: number, 
    prefix?: string
  ): Promise<void> {
    try {
      if (!this.kv) {
        return; // Cache not available, skip
      }
      const cacheKey = this.generateKey(key, prefix);
      const expirationTtl = ttl || this.defaultTTL;
      
      await this.kv.put(cacheKey, JSON.stringify(value), {
        expirationTtl,
      });
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string, prefix?: string): Promise<void> {
    try {
      if (!this.kv) {
        return; // Cache not available, skip
      }
      const cacheKey = this.generateKey(key, prefix);
      await this.kv.delete(cacheKey);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  /**
   * Get or set cached data (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    prefix?: string
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, prefix);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch data
    const freshData = await fetchFn();
    
    // Store in cache for next time
    await this.set(key, freshData, ttl, prefix);
    
    return freshData;
  }

  /**
   * Invalidate cache by pattern (useful for related data)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // KV doesn't support pattern deletion directly
      // This is a placeholder for pattern-based invalidation
      // In practice, you'd maintain a list of keys or use a different strategy
      console.log(`Invalidating cache pattern: ${pattern}`);
      
      // For now, we'll implement specific invalidation methods
      // like invalidateUserCache, invalidateAllUsers, etc.
    } catch (error) {
      console.error("Cache pattern invalidation error:", error);
    }
  }

  /**
   * User-specific cache invalidation
   */
  async invalidateUserCache(userId: number): Promise<void> {
    await Promise.all([
      this.delete(`user:${userId}`, "users"),
      this.delete("all", "users"), // Invalidate users list cache
    ]);
  }

  /**
   * Invalidate all users cache
   */
  async invalidateAllUsersCache(): Promise<void> {
    await this.delete("all", "users");
  }
}

// Cache key constants
export const CACHE_KEYS = {
  USERS: {
    ALL: "all",
    BY_ID: (id: number) => `user:${id}`,
    BY_EMAIL: (email: string) => `email:${email}`,
  }
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes  
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const; 