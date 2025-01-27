import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './service/user.service';
import { UserRepository } from './repository/user.repository';
import { WellnessRepository } from './repository/wellness.repository';
import { WellnessService } from './service/wellness.service';

@Module({
  controllers: [UserController],
  providers: [WellnessRepository, WellnessService, UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
