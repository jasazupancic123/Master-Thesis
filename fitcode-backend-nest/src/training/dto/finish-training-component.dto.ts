import { PickType } from '@nestjs/swagger';

import { TrainingReport } from '../entity/training-report.entity';

export class FinishTrainingComponentDto extends PickType(TrainingReport, [
  'status',
] as const) {}
