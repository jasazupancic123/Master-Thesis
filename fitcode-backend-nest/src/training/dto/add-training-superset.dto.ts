import { PickType } from '@nestjs/mapped-types';
import { Superset } from '../entity/superset.entity';
import { CreateSuperset } from '../type/superset.type';

export class AddTrainingSupersetDto
  extends PickType(Superset, ['color', 'exercises'])
  implements Omit<CreateSuperset, 'exercises'> {}
