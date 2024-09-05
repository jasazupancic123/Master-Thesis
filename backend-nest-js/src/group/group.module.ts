import { forwardRef, Module } from '@nestjs/common';
import { GroupService } from './service/group.service';
import { GroupController } from './group.controller';
import { UserModule } from '../user/user.module';
import { TrainingModule } from '../training/training.module';
import { GroupRepository } from './repository/group.repository';
import { SubgroupRepository } from './repository/subgroup.repository';
import { CycleRepository } from './repository/cycle.repository';
import { CycleService } from './service/cycle.service';
import { SubgroupService } from './service/subgroup.service';

@Module({
  imports: [UserModule, forwardRef(() => TrainingModule)],
  controllers: [GroupController],
  providers: [
    GroupRepository,
    SubgroupRepository,
    CycleRepository,
    CycleService,
    SubgroupService,
    GroupService,
  ],
  exports: [
    GroupRepository,
    SubgroupRepository,
    CycleRepository,
    CycleService,
    SubgroupService,
    GroupService,
  ],
})
export class GroupModule {
}
