import { Subgroup } from '../entity/subgroup.entity';
import { PickType } from '@nestjs/mapped-types';
import { CreateSubgroup } from '../type/subgroup.type';

// NOTE - `components` are inferred from parent training
export class AddSubgroupDto
  extends PickType(Subgroup, ['name', 'membersIds'])
  implements Omit<CreateSubgroup, 'components'> {}
