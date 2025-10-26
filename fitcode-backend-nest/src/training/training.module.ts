import { Module } from '@nestjs/common';

import { ChangeLogModule } from '@src/change-log/change-log.module';
import { PeriodizationModule } from '@src/periodization/periodization.module';

import { AttributeModule } from '../attribute/attribute.module';
import { ComponentModule } from '../component/component.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { GroupModule } from '../group/group.module';
import { InstitutionModule } from '../institution/institution.module';
import { MethodModule } from '../method/method.module';
import { Training } from './entity/training.entity';
import { TrainingRepository } from './repository/training.repository';
import { TrainingReportRepository } from './repository/training-report.repository';
import { WorkloadRepository } from './repository/workload.repository';
import { TrainingService } from './service/training.service';
import { TrainingPlanService } from './service/training-plan.service';
import { TrainingReportService } from './service/training-report.service';
import { WorkloadService } from './service/workload.service';
import { TrainingController } from './training.controller';

@Module({
  imports: [
    ChangeLogModule.forEntity(Training),
    AttributeModule,
    MethodModule,
    ComponentModule,
    InstitutionModule,
    ExerciseModule,
    GroupModule,
    PeriodizationModule,
    ExerciseModule,
  ],
  providers: [
    WorkloadRepository,
    TrainingService,
    TrainingReportRepository,
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
