import { Module } from '@nestjs/common';

import { PeriodizationModule } from '@src/periodization/periodization.module';
import { UserModule } from '@src/user/user.module';

import { AttributeModule } from '../attribute/attribute.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { InstitutionModule } from '../institution/institution.module';
import { TrainingRepository } from './repository/training.repository';
import { TrainingComponentUserStatusRepository } from './repository/training-component-user-status.repository';
import { WorkloadRepository } from './repository/workload.repository';
import { ActiveTrainingService } from './service/active-training.service';
import { TrainingService } from './service/training.service';
import { TrainingPlanService } from './service/training-plan.service';
import { TrainingProtocolService } from './service/training-protocol.service';
import { TrainingReportService } from './service/training-report.service';
import { WorkloadService } from './service/workload.service';
import { TrainingController } from './training.controller';

@Module({
  imports: [
    AttributeModule,
    InstitutionModule,
    PeriodizationModule,
    ExerciseModule,
    UserModule,
  ],
  providers: [
    WorkloadRepository,
    TrainingService,
    TrainingComponentUserStatusRepository,
    TrainingRepository,
    WorkloadService,
    TrainingReportService,
    TrainingPlanService,
    ActiveTrainingService,
    TrainingProtocolService,
  ],
  controllers: [TrainingController],
  exports: [
    TrainingService,
    WorkloadRepository,
    TrainingRepository,
    WorkloadService,
    TrainingReportService,
    TrainingPlanService,
    ActiveTrainingService,
    TrainingProtocolService,
  ],
})
export class TrainingModule {}
