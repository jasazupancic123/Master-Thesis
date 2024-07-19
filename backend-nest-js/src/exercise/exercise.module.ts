import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { ComponentModule } from '../component/component.module';

@Module({
  controllers: [ExerciseController],
  providers: [ExerciseService],
  imports: [FirebaseModule, ComponentModule]
})
export class ExerciseModule {}
