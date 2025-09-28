import { Module } from '@nestjs/common';

import { AttributeService } from './service/attribute.service';

@Module({
  providers: [AttributeService],
  exports: [AttributeService],
})
export class AttributeModule {}
