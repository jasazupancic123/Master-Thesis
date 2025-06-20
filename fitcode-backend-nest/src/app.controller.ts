import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CacheManagerService } from './cache-manager/cache-manager.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('General')
@Controller()
export class AppController {
  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('clear-cache')
  async clearCache() {
    try {
      await this.cacheManagerService.clear();
      return 'cleared';
    } catch (e: any) {
      return `not cleared: ${e.message}`;
    }
  }
}
