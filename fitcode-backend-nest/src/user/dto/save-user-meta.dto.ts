import { PickType } from '@nestjs/mapped-types';
import { UserMeta } from '../entity/user-meta.entity';

export class SaveUserMetaDto extends PickType(UserMeta, [
  'date',
  'weight',
  'comment',
  'fatigue',
  'soreness',
  'sleep',
]) {}
