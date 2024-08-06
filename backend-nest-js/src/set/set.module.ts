import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { SetGroupEntity } from './entity/set-group.entity';
import { SetSubgroupEntity } from './entity/set-subgroup.entity';
import { SetExerciseEntity } from './entity/set-exercise.entity';
import { SetGroupService } from './service/set-group.service';
import { SetSubgroupService } from './service/set-subgroup.service';
import { SetExerciseService } from './service/set-exercise.service';

@Module({
  imports: [
    FirebaseModule.forFeature([
      // @ts-ignore
      SetGroupEntity,
      // @ts-ignore
      SetSubgroupEntity,
      // @ts-ignore
      SetExerciseEntity,
    ]),
  ],
  providers: [
    SetGroupService,
    SetSubgroupService,
    SetExerciseService,
  ],
})
export class SetModule {
}