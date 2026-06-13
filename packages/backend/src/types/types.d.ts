// src/types.d.ts
declare module 'cache-manager-ioredis';declare module 'cache-manager';
declare module 'cache-manager';

// Cache-manager v5 compatibility
declare module 'cache-manager' {
  interface Cache {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    ttl?(key: string): Promise<number>;
  }
}
