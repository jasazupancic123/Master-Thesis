import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { BaseSetup } from './base.setup';

export class SwaggerSetup extends BaseSetup {
  constructor(app: INestApplication) {
    super(app);
  }

  setup() {
    const config = new DocumentBuilder()
      .setTitle('FitCode Nest JS API')
      .setDescription('The FitCode API description')
      .setVersion('0.0.1')
      .addTag('Fitcode Backend')
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('api', this.app, document);
  }
}
