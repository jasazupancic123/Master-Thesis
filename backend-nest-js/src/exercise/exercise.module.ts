import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { ComponentModule } from '../component/component.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule, ComponentModule],
  controllers: [ExerciseController],
  providers: [ExerciseService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
