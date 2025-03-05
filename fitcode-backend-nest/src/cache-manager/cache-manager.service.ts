import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CACHE_KEY_FLAT_COMPONENTS } from '../common/constant/cache.constant';
import { Wrapper } from '../common/type/wrapper.type';
import { ComponentService } from '../component/component.service';
import { Component } from '../component/entity/component.entity';

@Injectable()
export class CacheManagerService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
  ) {}

  async getComponents(): Promise<Component[]> {
    const cached = await this.cacheManager.get(CACHE_KEY_FLAT_COMPONENTS);
    if (!cached) {
      const components = await this.componentService.findAllFlat();
      await this.cacheManager.set(
        CACHE_KEY_FLAT_COMPONENTS,
        components,
        24 * 3600 * 1000,
      );

      return components;
    }

    return await this.cacheManager.get(CACHE_KEY_FLAT_COMPONENTS);
  }

  async clearComponents(): Promise<void> {
    await this.cacheManager.del(CACHE_KEY_FLAT_COMPONENTS);
  }
}
