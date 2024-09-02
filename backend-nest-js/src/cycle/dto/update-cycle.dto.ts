import { PartialType } from '@nestjs/swagger';
import { PickType } from '@nestjs/mapped-types';
import { Cycle } from '../../group/entity/cycle.entity';

export class UpdateCycleDto extends PartialType(PickType(Cycle, [
  'name',
  'startDate',
  'endDate',
] as const)) {
}
