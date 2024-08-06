import { forwardRef, Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { CycleModule } from '../cycle/cycle.module';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { ExerciseInfoService } from '../exercise-info/service/exercise-info.service';
import { ExerciseInfoEntity } from '../exercise-info/entity/exercise-info.entity';
import { TrainingEntity } from './entity/training.entity';
import { SuperExerciseInfoEntity } from '../exercise-info/entity/super-exercise-info.entity';
import { SuperExerciseInfoService } from '../exercise-info/service/super-exercise-info.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    // @ts-ignore to ignore use of "new" keyword with classes
    FirebaseModule.forFeature([
      // @ts-ignore
      ExerciseInfoEntity,
      // @ts-ignore
      SuperExerciseInfoEntity,
      // @ts-ignore
      TrainingEntity,
    ]),
    ComponentModule,
    ExerciseModule,
    forwardRef(() => UserModule),
    forwardRef(() => CycleModule),
  ],
  providers: [

    ExerciseInfoService,
    SuperExerciseInfoService,
    TrainingService,
  ],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {
}