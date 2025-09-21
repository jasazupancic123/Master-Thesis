import { Injectable } from '@nestjs/common';

import { TrainingReportRef } from '@src/common/type/firestore.type';
import { TrainingReport } from '@src/training/entity/training-report.entity';
import { TrainingReportRepository } from '@src/training/repository/training-report.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class TrainingReportTestRepository extends TestRepositoryMixin<
  TrainingReport,
  TrainingReportRef
>()(TrainingReportRepository) {}
