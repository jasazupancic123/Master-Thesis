import { PartialType } from '@nestjs/swagger';
import { PickType } from '@nestjs/mapped-types';
import { CycleDto } from './cycle.dto';

export class UpdateCycleDto extends PartialType(PickType(CycleDto, [
  'name',
  'startDate',
  'endDate',
] as const)) {}
