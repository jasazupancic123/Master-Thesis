import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { ComponentModule } from '../component/component.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { ExerciseEntity } from './entity/exercise.entity';
import { ExerciseAttribute } from './entity/exercise-attribute.entity';
import { ExerciseAttributeValue } from './entity/exercise-attribute-value.entity';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([ExerciseEntity, ExerciseAttribute, ExerciseAttributeValue]),
    ComponentModule,
  ],
  controllers: [ExerciseController],
  providers: [ExerciseService],
  exports: [ExerciseService],
})
export class ExerciseModule {
}
