import { Module } from '@nestjs/common';
import { AttributeRepository } from './repository/attribute.repository';
import { AttributeService } from './service/attribute.service';
import { AttributeController } from './attribute.controller';

@Module({
  controllers: [AttributeController],
  providers: [AttributeRepository, AttributeService],
  exports: [AttributeService],
})
export class AttributeModule {}
