import { Global, Module } from '@nestjs/common';

import { InstitutionModule } from '@src/institution/institution.module';

import { ProfileController } from './profile.controller';
import { ProfileRepository } from './repository/profile.repository';
import { WellnessRepository } from './repository/wellness.repository';
import { ProfileService } from './service/profile.service';
import { WellnessService } from './service/wellness.service';

@Global()
@Module({
  imports: [InstitutionModule],
  controllers: [ProfileController],
  providers: [
    ProfileRepository,
    ProfileService,
    WellnessRepository,
    WellnessService,
  ],
  exports: [ProfileService, WellnessService],
})
export class ProfileModule {}
