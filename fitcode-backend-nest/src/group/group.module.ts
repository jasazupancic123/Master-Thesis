import { forwardRef, Module } from '@nestjs/common';

import { InstitutionModule } from '../institution/institution.module';
import { TrainingModule } from '../training/training.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupRepository } from './repository/group.repository';

@Module({
  imports: [forwardRef(() => TrainingModule), InstitutionModule],
  controllers: [GroupController],
  providers: [GroupRepository, GroupService],
  exports: [GroupService],
})
export class GroupModule {}
