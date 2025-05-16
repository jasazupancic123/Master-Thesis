import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { InstitutionController } from './institution.controller';
import { InstitutionRepository } from './repository/institution.repository';
import { InstitutionService } from './service/institution.service';

@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => InstitutionModule)],
  controllers: [InstitutionController],
  providers: [InstitutionRepository, InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}
