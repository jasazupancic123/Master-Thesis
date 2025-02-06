import { PickType } from '@nestjs/mapped-types';
import { Superset } from '../entity/superset.entity';
import { UpdateSuperset } from '../type/superset.type';

export class UpdateTrainingSupersetDto
  extends PickType(Superset, ['order', 'color'] as const)
  implements UpdateSuperset {}
