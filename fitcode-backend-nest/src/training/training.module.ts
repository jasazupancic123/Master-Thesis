import { forwardRef, Module } from '@nestjs/common';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';
import { UserModule } from '../user/user.module';
import { TrainingRepository } from './repository/training.repository';
import { WorkloadRepository } from './repository/workload.repository';
import { TrainingPlanService } from './service/training-plan.service';
import { TrainingService } from './service/training.service';
import { WorkloadService } from './service/workload.service';
import { TrainingController } from './training.controller';
import { AttributeModule } from '../attribute/attribute.module';
import { PeriodizationService } from './service/periodization.service';
import { InstitutionModule } from '../institution/institution.module';

@Module({
  imports: [
    AttributeModule,
    ComponentModule,
    forwardRef(() => ExerciseModule),
    forwardRef(() => UserModule),
    forwardRef(() => GroupModule),
    InstitutionModule,
  ],
  providers: [
    PeriodizationService,
    WorkloadRepository,
    TrainingService,
    TrainingRepository,
    WorkloadService,
    TrainingPlanService,
  ],
  controllers: [TrainingController],
  exports: [
    TrainingService,
    WorkloadRepository,
    TrainingRepository,
    WorkloadService,
    TrainingPlanService,
  ],
})
export class TrainingModule {}
