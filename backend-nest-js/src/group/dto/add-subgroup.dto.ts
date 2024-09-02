import { Subgroup } from '../entity/subgroup.entity';
import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { IdDto } from '../../common/dto/id.dto';

export class AddSubgroupDto extends IntersectionType(
  IdDto, // parent group id
  PickType(Subgroup, ['name', 'cycleId', 'membersIds', 'from', 'to'] as const),
) {
}