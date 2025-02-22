import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ExerciseAttribute } from 'src/exercise/entity/exercise-attribute.entity';
import { ExerciseAttributeService } from 'src/exercise/service/exercise-attribute.service';
import {
  CACHE_KEY_EXERCISE_ATTRIBUTES,
  CACHE_KEY_FLAT_COMPONENTS,
} from '../common/constant/cache.constant';
import { Wrapper } from '../common/type/wrapper.type';
import { ComponentService } from '../component/component.service';
import { Component } from '../component/entity/component.entity';

@Injectable()
export class CacheManagerService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
    @Inject(forwardRef(() => ExerciseAttributeService))
    private readonly exerciseAttributeService: Wrapper<ExerciseAttributeService>,
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

  async getAttributes(): Promise<ExerciseAttribute[]> {
    const cached = await this.cacheManager.get(CACHE_KEY_EXERCISE_ATTRIBUTES);
    if (!cached) {
      const attributes = await this.exerciseAttributeService.findAll();

      await this.cacheManager.set(
        CACHE_KEY_EXERCISE_ATTRIBUTES,
        attributes,
        24 * 3600 * 1000,
      );

      return attributes;
    }

    return await this.cacheManager.get(CACHE_KEY_EXERCISE_ATTRIBUTES);
  }

  async clearAttributes(): Promise<void> {
    await this.cacheManager.del(CACHE_KEY_EXERCISE_ATTRIBUTES);
  }
}
