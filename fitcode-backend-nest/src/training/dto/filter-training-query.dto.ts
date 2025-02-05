import { Training } from '../entity/training.entity';
import { DateFilterDto } from '../../common/dto/date-filter.dto';
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';

export class FilterTrainingQueryDto extends IntersectionType(
  PartialType(PickType(Training, ['groupId', 'cycleId'] as const)),
  DateFilterDto,
) {}
