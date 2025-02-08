import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { Superset } from '../entity/superset.entity';
import { UpdateSuperset } from '../type/superset.type';
import { SubgroupIdDto } from 'src/common/dto/subgroup-id.dto';

export class UpdateTrainingSupersetDto
  extends IntersectionType(
    PickType(Superset, ['order', 'color'] as const),
    SubgroupIdDto,
  )
  implements UpdateSuperset {}
