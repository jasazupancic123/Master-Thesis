import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filter/all-exception.filter';
import { CommonService } from './common/service/common.service';
import { DataSetup } from './common/setup/data.setup';
import { SwaggerSetup } from './common/setup/swagger.setup';
import { Environment } from './config/environment-validation-schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger(bootstrap.name);
  const configService = app.get(ConfigService<Environment>);
  const commonService = app.get(CommonService);
  const httpAdapter = app.get(HttpAdapterHost);

  // config
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

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter.httpAdapter as any));

  // setups
  new SwaggerSetup(app).setup();
  if (commonService.env.isDev()) await new DataSetup(app).setup();

  // start server
  const port = configService.get('PORT');
  await app.listen(port);
  logger.log(`Application started on http://localhost:${port}`);
}

bootstrap().then();
