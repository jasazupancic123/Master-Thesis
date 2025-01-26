import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../../config/environment-validation-schema';

export abstract class BaseSetup<T = any> {
  protected readonly configService: ConfigService<Environment>;
  protected readonly logger: Logger;

  protected constructor(protected readonly app: INestApplication) {
    this.configService = app.get(ConfigService);
    this.logger = new Logger(this.constructor.name);
  }

  abstract setup(options?: T): void | Promise<void>;
}