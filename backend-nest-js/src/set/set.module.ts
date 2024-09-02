import { forwardRef, Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { TrainingComponent } from '../training/entity/training-component.entity';
import { TrainingExercise } from '../training/entity/training-exercise.entity';
import { SetExercise } from './entity/set-exercise.entity';
import { SetService } from './set.service';
import { ExerciseInfoModule } from '../exercise-info/exercise-info.module';
import { TrainingModule } from '../training/training.module';
import { ExerciseModule } from '../exercise/exercise.module';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([TrainingComponent, TrainingExercise, SetExercise]),
    ExerciseInfoModule,
    ExerciseModule,
    forwardRef(() => TrainingModule),
  ],
  providers: [SetService],
  exports: [SetService],
})
export class SetModule {
}