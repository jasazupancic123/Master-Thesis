import { forwardRef, Module } from '@nestjs/common';
import { GroupService } from './service/group.service';
import { GroupController } from './group.controller';
import { UserModule } from '../user/user.module';
import { TrainingModule } from '../training/training.module';
import { GroupRepository } from './repository/group.repository';
import { SubgroupRepository } from './repository/subgroup.repository';
import { SubgroupService } from './service/subgroup.service';

@Module({
  imports: [UserModule, forwardRef(() => TrainingModule)],
  controllers: [GroupController],
  providers: [
    GroupRepository,
    SubgroupRepository,
    SubgroupService,
    GroupService,
  ],
  exports: [GroupRepository, SubgroupRepository, SubgroupService, GroupService],
})
export class GroupModule {}
