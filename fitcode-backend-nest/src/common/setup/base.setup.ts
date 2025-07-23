import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Environment } from '@src/config/environment-validation-schema';

export abstract class BaseSetup<T = unknown> {
  protected readonly configService: ConfigService<Environment>;
  protected readonly logger: Logger;

  protected constructor(protected readonly app: INestApplication) {
    this.configService = app.get(ConfigService);
    this.logger = new Logger(this.constructor.name);
  }

  abstract setup(options?: T): void | Promise<void>;
}
