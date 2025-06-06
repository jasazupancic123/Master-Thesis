import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { MethodController } from './method.controller';
import { MethodRepository } from './repository/method.repository';
import { MethodService } from './service/method.service';

@Module({
  controllers: [MethodController],
  providers: [MethodRepository, MethodService],
  exports: [MethodRepository, MethodService],
})
export class MethodModule {}
