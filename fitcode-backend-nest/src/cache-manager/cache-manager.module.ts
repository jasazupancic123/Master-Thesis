import { Global, Module } from '@nestjs/common';
import { CacheManagerService } from './cache-manager.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ComponentModule } from '../component/component.module';
import { AttributeModule } from '../attribute/attribute.module';

@Global()
@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    ComponentModule,
    AttributeModule,
  ],
  providers: [CacheManagerService],
  exports: [CacheManagerService],
})
export class CacheManagerModule {}
