import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { IdEntity } from '@/common/entity/id.entity';
import { Training } from '@/training/entity/training.entity';
import { Group } from '@/group/entity/group.entity';

export type Week = {
  date: Date;
}

export type Cycle = IdEntity & TimestampEntity & {
  name: string;
  description?: string;
  from: Date;
  to: Date;
  trainings: Training[];
  weeks: Week[][];
  group: Group | null;
}