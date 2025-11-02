import type { CycleTarget } from './cycle-target.type';
import type { BaseEntity } from '@/core/entity.type';
import type { DateRange } from '@/lib/common/type/date-range.type';

export type Cycle = BaseEntity &
  Required<DateRange> & {
    name: string;
    description?: string;
    targets: CycleTarget[];
  };

export interface Week {
  date: Date;
}
