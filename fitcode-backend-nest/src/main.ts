import type { INestApplication } from '@nestjs/common';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { config } from 'dotenv';
import express from 'express';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filter/all-exception.filter';
import { CommonService } from './common/service/common.service';
import { DataSetup } from './common/setup/data.setup';
import { SwaggerSetup } from './common/setup/swagger.setup';
import type { Environment } from './config/environment-validation-schema';

config({ quiet: true, path: '.env.prod' });

const server = express();

async function createApp(
  expressInstance: express.Express,
): Promise<INestApplication> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  const httpAdapter = app.get(HttpAdapterHost);

  // config
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

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
  await app.listen(port);
  logger.log(`Application started on http://localhost:${port}`);
}

async function bootstrap(expressInstance: express.Express): Promise<void> {
  const app = await createApp(expressInstance);
  await initApp(app);
}

bootstrap(server)
  .then()
  .catch((error) => {
    const logger = new Logger(initApp.name);
    logger.error('Error during application bootstrap', error);
    process.exit(1);
  });
