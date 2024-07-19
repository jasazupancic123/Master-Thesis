import { CycleDto } from './cycle.dto';
import { PickType } from '@nestjs/mapped-types';

export class CreateCycleDto extends PickType(CycleDto, [
  'name',
  'description',
  'groupId',
  'startDate',
  'endDate',
] as const) {}
