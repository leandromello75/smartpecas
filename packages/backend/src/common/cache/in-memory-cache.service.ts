import { Injectable } from '@nestjs/common';

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt?: number;
}

@Injectable()
export class InMemoryCacheService {
  private readonly entries = new Map<string, CacheEntry>();

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    const ttlMs = this.normalizeTtl(ttl);
    this.entries.set(key, {
      value,
      ...(ttlMs ? { expiresAt: Date.now() + ttlMs } : {}),
    });
  }

  async del(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async ttl(key: string): Promise<number | undefined> {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return undefined;
    }

    if (!entry.expiresAt) {
      return undefined;
    }

    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  }

  async reset(): Promise<void> {
    this.entries.clear();
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  private isExpired(entry: CacheEntry): boolean {
    return typeof entry.expiresAt === 'number' && entry.expiresAt <= Date.now();
  }

  private normalizeTtl(ttl?: number): number | undefined {
    if (!ttl || ttl <= 0) {
      return undefined;
    }

    return ttl < 10000 ? ttl * 1000 : ttl;
  }
}
