import { PartialType } from '@nestjs/swagger';
import { PickType } from '@nestjs/mapped-types';
import { Cycle } from '../entity/cycle.entity';

export class UpdateCycleDto extends PartialType(PickType(Cycle, [
  'name',
  'startDate',
  'endDate',
] as const)) {
}
