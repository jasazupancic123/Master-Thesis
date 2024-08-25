import { forwardRef, Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { SuperExerciseInfo } from './entity/super-exercise-info.entity';
import { ExerciseInfo } from './entity/exercise-info.entity';
import { ExerciseInfoService } from './exercise-info.service';
import { ExerciseModule } from '../exercise/exercise.module';
import { SetModule } from '../set/set.module';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([SuperExerciseInfo, ExerciseInfo]),
    forwardRef(() => SetModule),
    ExerciseModule,
  ],
  providers: [ExerciseInfoService],
  exports: [ExerciseInfoService],
})
export class ExerciseInfoModule {
}