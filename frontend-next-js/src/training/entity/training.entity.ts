import { TimestampEntity } from "@/common/entity/timestamp.entity";
import { IdEntity } from '@/common/entity/id.entity';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { TrainingComponent } from '@/training/entity/training-component.entity';

export type Training = IdEntity & TimestampEntity & {
  subgroupId?: string | null;
  subgroup: Subgroup | null;
  from: Date;
  to: Date;
  components: TrainingComponent[];
}