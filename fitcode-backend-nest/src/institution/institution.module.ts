import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '@src/auth/auth.module';
import { ChangeLogModule } from '@src/change-log/change-log.module';

import { Institution } from './entity/institution.entity';
import { InstitutionController } from './institution.controller';
import { InstitutionRepository } from './repository/institution.repository';
import { InstitutionService } from './service/institution.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    ChangeLogModule.forEntity(Institution),
  ],
  controllers: [InstitutionController],
  providers: [InstitutionRepository, InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}
