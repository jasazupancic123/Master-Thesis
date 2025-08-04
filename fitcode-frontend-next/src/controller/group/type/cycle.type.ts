import type { SelectedTarget } from './selected-target.type';
import type { DateRange } from '@/common/type/date-range.type';
import type { BaseEntity, ColorEntity } from '@/common/type/entity.type';

export type Cycle = BaseEntity &
  ColorEntity &
  Required<DateRange> & {
    name: string;
    description?: string;
    selectedTargets: SelectedTarget[];

    // virtual
    weeks: Week[][];
  };

export interface Week {
  date: Date;
}
