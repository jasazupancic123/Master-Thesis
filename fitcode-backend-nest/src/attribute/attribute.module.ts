import { Module } from '@nestjs/common';

import { AttributeController } from './attribute.controller';
import { AttributeRepository } from './repository/attribute.repository';
import { AttributeService } from './service/attribute.service';

@Module({
  controllers: [AttributeController],
  providers: [AttributeRepository, AttributeService],
  exports: [AttributeService],
})
export class AttributeModule {}
