import { forwardRef, Module } from '@nestjs/common';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';
import { UserModule } from '../user/user.module';
import { TrainingRepository } from './repository/training.repository';
import { WorkloadRepository } from './repository/workload.repository';
import { TrainingPlanService } from './service/training-plan.service';
import { TrainingService } from './service/training.service';
import { UserWorkloadService } from './service/user-workload.service';
import { TrainingController } from './training.controller';
import { AttributeModule } from '../attribute/attribute.module';

@Module({
  imports: [
    AttributeModule,
    ComponentModule,
    ExerciseModule,
    forwardRef(() => UserModule),
    forwardRef(() => GroupModule),
  ],
  providers: [
    WorkloadRepository,
    TrainingService,
    TrainingRepository,
    UserWorkloadService,
    TrainingPlanService,
  ],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {}
