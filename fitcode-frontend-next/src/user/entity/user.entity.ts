import { IdEntity } from '@/common/entity/id.entity';
import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { Wellness } from './wellness.entity';
import { Bodyweight } from './body-weight.entity';
import { Cycle } from '@/group/entity/cycle.entity';
import { Group } from '@/group/entity/group.entity';

export type UserEntity = IdEntity & TimestampEntity & {
  id: string;
  level: string;
  bodyweight: Bodyweight[];
  groups: Group[];
  cycles: Cycle[];
  wellness: Wellness[];
}