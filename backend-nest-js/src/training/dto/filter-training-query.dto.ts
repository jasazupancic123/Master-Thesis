import { Training } from '../entity/training.entity';
import { DateFilterDto } from '../../common/dto/date-filter.dto';
import { IntersectionType, PickType } from '@nestjs/mapped-types';

export class FilterTrainingQueryDto extends IntersectionType(
  PickType(Training, ['subgroupId'] as const),
  DateFilterDto,
) {
}