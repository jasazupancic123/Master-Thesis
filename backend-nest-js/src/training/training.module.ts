import { forwardRef, Module } from '@nestjs/common';
import { TrainingService } from './service/training.service';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';
import { TrainingExerciseUserDataRepository } from './repository/training-exercise-user-data.repository';
import { TrainingRepository } from './repository/training.repository';
import { TrainingComponentRepository } from './repository/training-component.repository';
import { TrainingExerciseRepository } from './repository/training-exercise.repository';
import { TrainingExerciseUserDataService } from './service/training-exercise-user-data.service';
import { TrainingExerciseService } from './service/training-exercise.service';
import { TrainingComponentService } from './service/training-component.service';
import { UserModule } from '../user/user.module';
import { TrainingSupersetRepository } from './repository/training-superset.repository';
import { TrainingSupersetService } from './service/training-superset.service';

@Module({
  imports: [
    UserModule,
    ComponentModule,
    ExerciseModule,
    forwardRef(() => GroupModule),
  ],
  providers: [
    TrainingRepository,
    TrainingComponentRepository,
    TrainingSupersetRepository,
    TrainingExerciseRepository,
    TrainingExerciseUserDataRepository,
    TrainingExerciseUserDataService,
    TrainingExerciseService,
    TrainingSupersetService,
    TrainingComponentService,
    TrainingService,
  ],
  exports: [TrainingService],
})
export class TrainingModule {}
