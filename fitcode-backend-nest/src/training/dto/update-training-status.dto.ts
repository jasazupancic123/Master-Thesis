import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';

import { UserIdDto } from '@src/common/dto/user-id.dto';

import { TrainingReport } from '../entity/training-report.entity';

export class UpdateTrainingStatusDto extends PickType(TrainingReport, [
  'status',
] as const) {}

export class UpdateTrainingStatusForUserDto extends IntersectionType(
  PartialType(UserIdDto),
  UpdateTrainingStatusDto,
) {}
