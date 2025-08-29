import { Global, Module } from '@nestjs/common';

import { ChangeLogModule } from '@src/change-log/change-log.module';
import { InstitutionRepository } from '@src/institution/repository/institution.repository';

import { Wellness } from './entity/wellness.entity';
import { UserRepository } from './repository/user.repository';
import { WellnessRepository } from './repository/wellness.repository';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';

@Global()
@Module({
  imports: [ChangeLogModule.forEntity(Wellness)],
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
