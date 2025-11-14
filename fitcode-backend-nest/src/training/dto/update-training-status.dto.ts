import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';

import { UserIdDto } from '@src/common/dto/user-id.dto';

import { TrainingComponentUserStatus } from '../entity/training-component-user-status.entity';

export class UpdateTrainingStatusDto extends PickType(
  TrainingComponentUserStatus,
  ['status'] as const,
) {}

export class UpdateTrainingStatusForUserDto extends IntersectionType(
  PartialType(UserIdDto),
  UpdateTrainingStatusDto,
) {}
