import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Environment } from './config/environment-validation-schema';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerSetup } from './common/setup/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    transformOptions: { enableImplicitConversion: true, },
  }));

  const logger = new Logger(bootstrap.name)
  const configService = app.get(ConfigService<Environment>)

  new SwaggerSetup().setup(app);

  const port = configService.get('PORT')
  await app.listen(port);
  logger.log(`Application started on http://localhost:${port}`);
}

bootstrap().then();
