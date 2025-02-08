import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { Superset } from '../entity/superset.entity';
import { CreateSuperset } from '../type/superset.type';
import { SubgroupIdDto } from 'src/common/dto/subgroup-id.dto';

export class AddTrainingSupersetDto
  extends IntersectionType(PickType(Superset, ['color']), SubgroupIdDto)
  implements Omit<CreateSuperset, 'exercises'> {}
