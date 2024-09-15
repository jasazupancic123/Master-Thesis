import { TimestampEntity } from '@/common/entity/timestamp.entity';
import { IdEntity } from '@/common/entity/id.entity';

export type Wellness = IdEntity & TimestampEntity & {
  sleep?: number;
  fatigue?: number;
  soreness?: number;
  comment?: string;
}