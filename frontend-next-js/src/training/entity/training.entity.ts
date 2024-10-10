import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { IdEntity } from '@/common/entity/id.entity';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { TrainingComponent } from '@/training/entity/training-component.entity';
import { Group } from '@/group/entity/group.entity';
import { Cycle } from '@/group/entity/cycle.entity';

export type Training = IdEntity & TimestampEntity & {
  groupId: string;
  group?: Group | null;
  cycleId: string;
  cycle?: Cycle | null;
  subgroupId?: string | null;
  subgroup: Subgroup | null;
  from: Date;
  to: Date;
  components: TrainingComponent[];
}