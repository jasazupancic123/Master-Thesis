import { Module } from '@nestjs/common';
import { WellnessRepository } from './repository/user-meta.repository';
import { UserRepository } from './repository/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [WellnessRepository, UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
