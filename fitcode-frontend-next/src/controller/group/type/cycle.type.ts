import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity, ColorEntity } from '@/common/type/entity.type';
import { SelectedTarget } from './selected-target.type';

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
