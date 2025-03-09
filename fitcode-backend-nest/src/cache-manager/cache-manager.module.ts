import { Global, Module } from '@nestjs/common';
import { CacheManagerService } from './cache-manager.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ComponentModule } from '../component/component.module';

@Global()
@Module({
  imports: [CacheModule.register({ isGlobal: true }), ComponentModule],
  providers: [CacheManagerService],
  exports: [CacheManagerService],
})
export class CacheManagerModule {}
