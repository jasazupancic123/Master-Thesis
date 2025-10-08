import type { INestApplication } from '@nestjs/common';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filter/all-exception.filter';
import { TimingInterceptor } from './common/interceptor/timing.interceptor';
import { CommonService } from './common/service/common.service';
import { DataSetup } from './common/setup/data.setup';
import { SwaggerSetup } from './common/setup/swagger.setup';
import { getCorsConfig } from './config/cors.config';
import type {
  Environment,
  NodeEnv,
} from './config/environment-validation-schema';

const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
if (!['production', 'staging'].includes(nodeEnv)) {
  // in production and staging, the environment variables are set in other ways
  config({ quiet: true, path: `.env.${nodeEnv}` });
} else {
  console.log(
    `Running in ${nodeEnv} mode, assuming environment variables are set externally.`,
  );
}

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  const httpAdapter = app.get(HttpAdapterHost);

  // config
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.enableCors(getCorsConfig(app));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new TimingInterceptor());
  app.useGlobalFilters(
    new AllExceptionsFilter(
      httpAdapter.httpAdapter as unknown as HttpAdapterHost,
    ),
  );

  return app;
}

async function initApp(app: INestApplication): Promise<void> {
  const logger = new Logger(initApp.name);
  const configService = app.get(ConfigService<Environment>);
  const commonService = app.get(CommonService);

  // setups
  new SwaggerSetup(app).setup();
  if (commonService.env.isDev()) await new DataSetup(app).setup();

  // start server
  const port = configService.get('PORT');
  await app.listen(
    port,
    commonService.env.isProduction() ? '0.0.0.0' : undefined,
  );
  logger.log(`Application started on http://localhost:${port}`);
}

async function bootstrap(): Promise<void> {
  const app = await createApp();
  await initApp(app);
}

bootstrap()
  .then()
  .catch((error) => {
    const logger = new Logger(initApp.name);
    logger.error('Error during application bootstrap', error);
    process.exit(1);
  });
