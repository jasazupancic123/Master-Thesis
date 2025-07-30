import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';

import { Training } from '../entity/training.entity';

export class FilterTrainingQueryDto extends IntersectionType(
  PartialType(PickType(Training, ['groupId', 'cycleId'] as const)),
  DateFilterDto,
) {}
