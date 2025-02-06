import { PickType } from '@nestjs/mapped-types';
import { UserMeta } from '../entity/user-meta.entity';

export class CreateUserMetaDto
  extends PickType(UserMeta, [
    'userId',
    'weight',
    'sleep',
    'fatigue',
    'soreness',
    'comment',
  ])
  implements Omit<UserMeta, 'date'> {}
