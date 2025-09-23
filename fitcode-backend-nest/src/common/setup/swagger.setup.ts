import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { BaseSetup } from './base.setup';

export class SwaggerSetup extends BaseSetup {
  constructor(app: INestApplication) {
    super(app);
  }

  setup() {
    const config = new DocumentBuilder()
      .setTitle('Blind/off Nest JS API')
      .setDescription('The Blind/off API description')
      .setVersion('0.0.1')
      .addTag('Blind/off Backend')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('api', this.app, document);
  }
}
