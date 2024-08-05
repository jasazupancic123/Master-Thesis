import { forwardRef, Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { CycleModule } from '../cycle/cycle.module';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { SetSubgroupEntity } from './entity/set-subgroup.entity';
import { SetExerciseEntity } from './entity/set-exercise.entity';
import { SetExerciseService } from './service/set-exercise.service';
import { ExerciseInfoService } from './service/exercise-info.service';
import { ExerciseInfoEntity } from './entity/exercise-info.entity';
import { SetGroupEntity } from './entity/set-group.entity';
import { SetGroupService } from './service/set-group.service';
import { SetSubgroupService } from './service/set-subgroup.service';
import { TrainingEntity } from './entity/training.entity';
import { SuperExerciseInfoEntity } from './entity/super-exercise-info.entity';
import { SuperExerciseInfoService } from './service/super-exercise-info.service';

@Module({
  imports: [
    // @ts-ignore to ignore use of "new" keyword with classes
    FirebaseModule.forFeature([
      // @ts-ignore
      SetGroupEntity,
      // @ts-ignore
      SetSubgroupEntity,
      // @ts-ignore
      SetExerciseEntity,
      // @ts-ignore
      ExerciseInfoEntity,
      // @ts-ignore
      SuperExerciseInfoEntity,
      // @ts-ignore
      TrainingEntity,
    ]),
    ComponentModule,
    ExerciseModule,
    forwardRef(() => CycleModule),
  ],
  providers: [
    SetGroupService,
    SetSubgroupService,
    SetExerciseService,
    ExerciseInfoService,
    SuperExerciseInfoService,
    TrainingService,
  ],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {
}