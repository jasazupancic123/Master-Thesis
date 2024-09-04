import { forwardRef, Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';
import { TrainingExerciseUserDataRepository } from './repository/training-exercise-user-data.repository';
import { TrainingRepository } from './repository/training.repository';
import { TrainingComponentRepository } from './repository/training-component.repository';
import { TrainingExerciseRepository } from './repository/training-exercise.repository';
import { TrainingExerciseUserDataService } from './service/training-exercise-user-data.service';

@Module({
  imports: [
    ComponentModule,
    ExerciseModule,
    forwardRef(() => GroupModule),
  ],
  providers: [
    TrainingRepository,
    TrainingComponentRepository,
    TrainingExerciseRepository,
    TrainingExerciseUserDataRepository,
    TrainingExerciseUserDataService,
    TrainingService,
  ],
  exports: [TrainingService],
})
export class TrainingModule {
}