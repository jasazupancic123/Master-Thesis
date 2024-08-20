import { forwardRef, Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { SuperExerciseInfoEntity } from './entity/super-exercise-info.entity';
import { ExerciseInfoEntity } from './entity/exercise-info.entity';
import { ExerciseInfoService } from './exercise-info.service';
import { ExerciseModule } from '../exercise/exercise.module';
import { SetModule } from '../set/set.module';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([SuperExerciseInfoEntity, ExerciseInfoEntity]),
    forwardRef(() => SetModule),
    ExerciseModule,
  ],
  providers: [ExerciseInfoService],
  exports: [ExerciseInfoService],
})
export class ExerciseInfoModule {
}