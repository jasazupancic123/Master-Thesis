import { forwardRef, Module } from '@nestjs/common';
import { TrainingModule } from '../training/training.module';
import { UserModule } from '../user/user.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupRepository } from './repository/group.repository';
import { InstitutionModule } from '../institution/institution.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => TrainingModule),
    forwardRef(() => InstitutionModule),
  ],
  controllers: [GroupController],
  providers: [GroupRepository, GroupService],
  exports: [GroupService],
})
export class GroupModule {}
