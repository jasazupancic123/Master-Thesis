import { Global, Module } from '@nestjs/common';

import { InstitutionModule } from '@src/institution/institution.module';

import { ProfileRepository } from './repository/profile.repository';
import { UserExerciseStatsRepository } from './repository/user-exercise-stats.repository';
import { WellnessRepository } from './repository/wellness.repository';
import { UserService } from './service/user.service';
import { WellnessService } from './service/wellness.service';
import { UserController } from './user.controller';

@Global()
@Module({
  imports: [InstitutionModule],
  controllers: [UserController],
  providers: [
    ProfileRepository,
    UserService,
    WellnessRepository,
    WellnessService,
    UserExerciseStatsRepository,
  ],
  exports: [UserService, WellnessService],
})
export class UserModule {}
