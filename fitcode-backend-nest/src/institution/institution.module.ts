import { Module } from '@nestjs/common';
import { InstitutionController } from './institution.controller';
import { InstitutionRepository } from './repository/institution.repository';
import { InstitutionService } from './service/institution.service';

@Module({
  controllers: [InstitutionController],
  providers: [InstitutionRepository, InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}
