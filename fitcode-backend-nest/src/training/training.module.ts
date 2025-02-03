import { forwardRef, Module } from '@nestjs/common';
import { TrainingService } from './service/training.service';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';
import { TrainingWorkloadRepository } from './repository/training-workload.repository';
import { TrainingRepository } from './repository/training.repository';
import { TrainingWorkloadService } from './service/training-workload.service';
import { UserModule } from '../user/user.module';
import { TrainingController } from './training.controller';

@Module({
  imports: [
    ComponentModule,
    ExerciseModule,
    forwardRef(() => UserModule),
    forwardRef(() => GroupModule),
  ],
  providers: [
    TrainingService,
    TrainingRepository,
    TrainingWorkloadRepository,
    TrainingWorkloadService,
  ],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {}
