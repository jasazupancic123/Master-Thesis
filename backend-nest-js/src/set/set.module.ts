import { forwardRef, Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { SetGroupEntity } from './entity/set-group.entity';
import { SetSubgroupEntity } from './entity/set-subgroup.entity';
import { SetExerciseEntity } from './entity/set-exercise.entity';
import { SetService } from './set.service';
import { ExerciseInfoModule } from '../exercise-info/exercise-info.module';
import { TrainingModule } from '../training/training.module';
import { ExerciseModule } from '../exercise/exercise.module';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([SetGroupEntity, SetSubgroupEntity, SetExerciseEntity]),
    ExerciseInfoModule,
    ExerciseModule,
    forwardRef(() => TrainingModule),
  ],
  providers: [SetService],
  exports: [SetService],
})
export class SetModule {
}