import { TimestampEntity } from '@/common/entity/timestamp.entity';

export type Wellness = TimestampEntity & {
  sleep?: number;
  fatigue?: number;
  soreness?: number;
  comment?: string;
}