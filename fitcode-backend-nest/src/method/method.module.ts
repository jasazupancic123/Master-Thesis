import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { MethodController } from './method.controller';
import { MethodRepository } from './repository/method.repository';
import { MethodService } from './service/method.service';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [MethodController],
  providers: [MethodRepository, MethodService],
  exports: [MethodService],
})
export class MethodModule {}