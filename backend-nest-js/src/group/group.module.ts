import { forwardRef, Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserModule } from '../user/user.module';
import { Group } from './entity/group.entity';
import { TrainingModule } from '../training/training.module';
import { GroupRepository } from './repository/group.repository';
import { SubgroupRepository } from './repository/subgroup.repository';
import { CycleRepository } from './repository/cycle.repository';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([Group]),
    UserModule,
    forwardRef(() => TrainingModule),
  ],
  controllers: [GroupController],
  providers: [GroupRepository, SubgroupRepository, CycleRepository, GroupService],
  exports: [GroupRepository, SubgroupRepository, CycleRepository, GroupService],
})
export class GroupModule {
}
