import type { SelectedTarget } from './selected-target.type';
import type { DateRange } from '@/lib/common/type/date-range.type';
import type { BaseEntity } from '@/core/entity.type';

export type Cycle = BaseEntity &
  Required<DateRange> & {
    name: string;
    description?: string;
    selectedTargets: SelectedTarget[];
  };

export interface Week {
  date: Date;
}
