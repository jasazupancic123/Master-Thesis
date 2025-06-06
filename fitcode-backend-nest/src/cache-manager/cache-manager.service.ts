import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  CACHE_KEY_ATTRIBUTES,
  CACHE_KEY_FLAT_COMPONENTS,
  CACHE_KEY_METHODS,
} from '../common/constant/cache.constant';
import { Wrapper } from '../common/type/wrapper.type';
import { ComponentService } from '../component/component.service';
import { Component } from '../component/entity/component.entity';
import { Attribute } from '../attribute/entity/attribute.entity';
import { AttributeService } from '../attribute/service/attribute.service';
import { MethodService } from 'src/method/service/method.service';
import { Method } from 'src/method/entity/method.entity';

@Injectable()
export class CacheManagerService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
    @Inject(forwardRef(() => AttributeService))
    private readonly attributeService: Wrapper<AttributeService>,
    @Inject(forwardRef(() => MethodService))
    private readonly methodService: Wrapper<MethodService>,
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

  async getAttributes(): Promise<Attribute[]> {
    const cached = await this.cacheManager.get(CACHE_KEY_ATTRIBUTES);
    if (!cached) {
      const attributes = await this.attributeService.findAll();
      await this.cacheManager.set(
        CACHE_KEY_ATTRIBUTES,
        attributes,
        24 * 3600 * 1000,
      );

      return attributes;
    }

    return await this.cacheManager.get(CACHE_KEY_ATTRIBUTES);
  }

  async clearAttributes(): Promise<void> {
    await this.cacheManager.del(CACHE_KEY_ATTRIBUTES);
  }

  async getMethods(): Promise<Method[]> {
    const cached = await this.cacheManager.get(CACHE_KEY_METHODS);
    if (!cached) {
      const methods = await this.methodService.findAll();
      await this.cacheManager.set(CACHE_KEY_METHODS, methods, 24 * 3600 * 1000);

      return methods;
    }

    return await this.cacheManager.get(CACHE_KEY_METHODS);
  }

  async clearMethods(): Promise<void> {
    await this.cacheManager.del(CACHE_KEY_METHODS);
  }
}
