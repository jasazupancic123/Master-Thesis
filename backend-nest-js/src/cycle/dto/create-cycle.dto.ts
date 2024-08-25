import { Cycle } from '../entity/cycle.entity';
import { PickType } from '@nestjs/mapped-types';

export class CreateCycleDto extends PickType(Cycle, [
  'name',
  'description',
  'groupId',
  'startDate',
  'endDate',
] as const) {
}
