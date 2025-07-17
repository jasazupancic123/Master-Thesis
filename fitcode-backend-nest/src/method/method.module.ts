import { Module } from '@nestjs/common';

import { MethodController } from './method.controller';
import { MethodRepository } from './repository/method.repository';
import { MethodService } from './service/method.service';

@Module({
  controllers: [MethodController],
  providers: [MethodRepository, MethodService],
  exports: [MethodRepository, MethodService],
})
export class MethodModule {}
