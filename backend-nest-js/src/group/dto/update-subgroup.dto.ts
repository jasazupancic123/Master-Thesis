import { UpdateSubgroup } from '../type/subgroup.type';
import { PartialType, PickType } from '@nestjs/mapped-types';
import { Subgroup } from '../entity/subgroup.entity';

export class UpdateSubgroupDto
  extends PartialType(PickType(Subgroup, ['name', 'membersIds']))
  implements UpdateSubgroup {}
