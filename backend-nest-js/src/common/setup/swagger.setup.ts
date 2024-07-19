import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export class SwaggerSetup {
  configure() {
    return new DocumentBuilder()
      .setTitle('FitCode Nest JS API')
      .setDescription('The FitCode API description')
      .setVersion('1.0')
      .addTag('fitcode')
      .build();
  }

  setup(app: INestApplication) {
    const config = this.configure();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }
}