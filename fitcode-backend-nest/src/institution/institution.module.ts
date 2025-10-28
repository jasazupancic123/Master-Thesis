import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '@src/auth/auth.module';

import { InstitutionController } from './institution.controller';
import { InstitutionRepository } from './repository/institution.repository';
import { InstitutionMembersRepository } from './repository/institution-members.repository';
import { InstitutionService } from './service/institution.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [InstitutionController],
  providers: [
    InstitutionRepository,
    InstitutionMembersRepository,
    InstitutionService,
  ],
  exports: [InstitutionService],
})
export class InstitutionModule {}
