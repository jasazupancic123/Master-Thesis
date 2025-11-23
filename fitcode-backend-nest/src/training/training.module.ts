import { Module } from '@nestjs/common';

import { PeriodizationModule } from '@src/periodization/periodization.module';

import { AttributeModule } from '../attribute/attribute.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { InstitutionModule } from '../institution/institution.module';
import { TrainingController } from './controller/training.controller';
import { TrainingRepository } from './repository/training.repository';
import { TrainingComponentUserStatusRepository } from './repository/training-component-user-status.repository';
import { WorkloadRepository } from './repository/workload.repository';
import { TrainingService } from './service/training.service';
import { TrainingPlanService } from './service/training-plan.service';
import { TrainingReportService } from './service/training-report.service';
import { WorkloadService } from './service/workload.service';

@Module({
  imports: [
    AttributeModule,
    InstitutionModule,
    PeriodizationModule,
    ExerciseModule,
  ],
  providers: [
    WorkloadRepository,
    TrainingService,
    TrainingComponentUserStatusRepository,
    TrainingRepository,
    WorkloadService,
    TrainingReportService,
    TrainingPlanService,
  ],
  controllers: [TrainingController],
  exports: [
    TrainingService,
    WorkloadRepository,
    TrainingRepository,
    WorkloadService,
    TrainingReportService,
    TrainingPlanService,
  ],
})
export class TrainingModule {}
