import { Global, Module } from '@nestjs/common';

import { ChangeLogModule } from '@src/change-log/change-log.module';
import { InstitutionModule } from '@src/institution/institution.module';

import { Wellness } from './entity/wellness.entity';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from './repository/profile.repository';
import { WellnessRepository } from './repository/wellness.repository';
import { ProfileService } from './service/profile.service';
import { WellnessService } from './service/wellness.service';

@Global()
@Module({
  imports: [InstitutionModule, ChangeLogModule.forEntity(Wellness)],
  controllers: [ProfileController],
  providers: [
    WellnessRepository,
    ProfileRepository,
    WellnessService,
    ProfileService,
  ],
  exports: [ProfileService, WellnessService],
})
export class ProfileModule {}
