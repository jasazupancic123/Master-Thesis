import { forwardRef, Module } from '@nestjs/common';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';
import { UserModule } from '../user/user.module';
import { TrainingRepository } from './repository/training.repository';
import { UserWorkloadRepository } from './repository/user-workload.repository';
import { SubgroupService } from './service/subgroup.service';
import { TrainingPlanService } from './service/training-plan.service';
import { TrainingService } from './service/training.service';
import { UserWorkloadService } from './service/user-workload.service';
import { TrainingController } from './training.controller';

@Module({
  imports: [
    ComponentModule,
    ExerciseModule,
    forwardRef(() => UserModule),
    forwardRef(() => GroupModule),
  ],
  providers: [
    UserWorkloadRepository,
    TrainingRepository,
    UserWorkloadService,
    SubgroupService,
    TrainingPlanService,
    TrainingService,
  ],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {}
