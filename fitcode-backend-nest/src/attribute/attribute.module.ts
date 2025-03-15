import { Module } from '@nestjs/common';
import { AttributeRepository } from './repository/attribute.repository';
import { AttributeService } from './service/attribute.service';

@Module({
  providers: [AttributeRepository, AttributeService],
  exports: [AttributeService],
})
export class AttributeModule {}
