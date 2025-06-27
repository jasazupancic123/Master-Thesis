import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CacheManagerService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, duration = 3600): Promise<void> {
    await this.cacheManager.set<T>(key, value, duration);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
