import { forwardRef, Module } from '@nestjs/common';
import { TrainingService } from './service/training.service';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';
import { UserWorkloadRepository } from './repository/user-workload.repository';
import { TrainingRepository } from './repository/training.repository';
import { UserWorkloadService } from './service/user-workload.service';
import { UserModule } from '../user/user.module';
import { TrainingController } from './training.controller';
import { SubgroupService } from './service/subgroup.service';
import { TrainingPlanService } from './service/training-plan.service';

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
    SubgroupService,
    UserWorkloadService,
    TrainingPlanService,
    TrainingService,
  ],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {}
