import { PickType } from '@nestjs/swagger';
import { Subgroup } from './subgroup.entity';

export class SubgroupMinimal extends PickType(Subgroup, [
  'id',
  'avgFutureWorkloadValues',
]) {}
