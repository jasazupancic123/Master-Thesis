import { forwardRef, Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [
    ComponentModule,
    ExerciseModule,
    forwardRef(() => GroupModule),
  ],
  providers: [TrainingService],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {
}