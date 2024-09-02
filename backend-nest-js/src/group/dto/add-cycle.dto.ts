import { Cycle } from '../entity/cycle.entity';
import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { IdDto } from '../../common/dto/id.dto';

export class AddCycleDto extends IntersectionType(
  IdDto, // group id
  PickType(Cycle, ['name', 'description', 'from', 'to'] as const)) {
}
