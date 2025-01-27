import { Subgroup } from '../entity/subgroup.entity';
import { PickType } from '@nestjs/mapped-types';
import { CreateSubgroup } from '../type/subgroup.type';

export class AddSubgroupDto
  extends PickType(Subgroup, ['name', 'from', 'to', 'membersIds'])
  implements CreateSubgroup {}
