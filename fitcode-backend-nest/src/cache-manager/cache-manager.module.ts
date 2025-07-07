import { Global, Module } from '@nestjs/common';
import { CacheManagerService } from './cache-manager.service';
import { CacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [CacheModule.register({ isGlobal: true })],
  providers: [CacheManagerService],
  exports: [CacheManagerService],
})
export class CacheManagerModule {}
