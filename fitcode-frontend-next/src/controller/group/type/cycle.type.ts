import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity, ColorEntity } from '@/common/type/entity.type';

export type Cycle = BaseEntity &
  ColorEntity &
  Required<DateRange> & {
    name: string;
    description?: string;
    selectedTargets: { componentId: string; targetId: string }[];

    // virtual
    weeks: Week[][];
  };

export interface Week {
  date: Date;
}
