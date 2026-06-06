// Simple in-memory cache to reduce API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new SimpleCache();
const pendingRequests = new Map<string, Promise<unknown>>();

// Cached fetch function
export async function cachedFetch<T>(
  url: string, 
  options?: RequestInit, 
  cacheMinutes: number = 5
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  // Try to get from cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = (async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as T;
    apiCache.set(cacheKey, data, cacheMinutes);
    return data;
  })();

  pendingRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}
