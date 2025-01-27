import { Cycle } from '../entity/cycle.entity';
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { UpdateCycle } from '../type/cycle.type';
import { DateFilterDto } from '../../common/dto/date-filter.dto';

export class UpdateCycleDto
  extends IntersectionType(
    PartialType(PickType(Cycle, ['name', 'description'] as const)),
    DateFilterDto,
  )
  implements Omit<UpdateCycle, 'membersIds'> {}
