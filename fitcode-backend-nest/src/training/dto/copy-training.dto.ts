import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { DateRangeDto } from '../../common/dto/date-range.dto';
import { CreateTrainingDto } from './create-training.dto';

export class CopyTrainingDto extends IntersectionType(
  PartialType(PickType(CreateTrainingDto, ['membersIds'] as const)),
  DateRangeDto,
) {}
