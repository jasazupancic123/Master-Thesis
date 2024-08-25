import { forwardRef, Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { CycleModule } from '../cycle/cycle.module';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { ExerciseInfo } from '../exercise-info/entity/exercise-info.entity';
import { Training } from './entity/training.entity';
import { SuperExerciseInfo } from '../exercise-info/entity/super-exercise-info.entity';
import { SetModule } from '../set/set.module';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([ExerciseInfo, SuperExerciseInfo, Training]),
    ComponentModule,
    ExerciseModule,
    forwardRef(() => CycleModule),
    forwardRef(() => SetModule),
  ],
  providers: [TrainingService],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {
}