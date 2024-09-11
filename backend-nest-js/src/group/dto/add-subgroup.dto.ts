import { Subgroup } from '../entity/subgroup.entity';
import { PickType } from '@nestjs/mapped-types';

export class AddSubgroupDto extends PickType(Subgroup, [
  'name',
  'cycleId',
  'membersIds',
  'from',
  'to',
] as const) {}
