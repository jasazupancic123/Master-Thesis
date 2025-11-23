import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { NodeEnv } from './config/environment-validation-schema';

@ApiTags('General')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  ping(): string {
    return this.appService.getHello();
  }

  /**
   * Warmup handler for App Engine to keep instances warm.
   */
  @Get('_ah/warmup')
  warmup(): void {
    const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
    this.logger.log(`Warming up instance ... (${nodeEnv})`);
  }
}
