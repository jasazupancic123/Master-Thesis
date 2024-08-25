import { PartialType, PickType } from '@nestjs/mapped-types';
import { Cycle } from '../entity/cycle.entity';
import { Filter } from '../../common/type/orm.type';

export class CycleFilterDto extends PartialType(PickType(Cycle, ['groupId'] as const)) implements Filter<Cycle> {
}