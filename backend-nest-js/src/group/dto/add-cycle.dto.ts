import { Cycle } from '../entity/cycle.entity';
import { PickType } from '@nestjs/mapped-types';
import { CreateCycle } from '../type/cycle.type';

export class AddCycleDto
  extends PickType(Cycle, ['name', 'description', 'from', 'to'])
  implements CreateCycle {}
