import { Global, Module } from '@nestjs/common';

import { InstitutionRepository } from '@src/institution/repository/institution.repository';

import { UserRepository } from './repository/user.repository';
import { WellnessRepository } from './repository/wellness.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Global()
@Module({
  controllers: [UserController],
  providers: [
    WellnessRepository,
    InstitutionRepository,
    UserRepository,
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
