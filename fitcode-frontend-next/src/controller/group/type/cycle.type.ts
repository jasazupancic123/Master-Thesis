import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity } from '@/common/type/entity.type';

export type Cycle = BaseEntity &
  Required<DateRange> & {
    name: string;
    description?: string;
    rootComponentsIds: string[];
    leafComponentsIds: string[];

    // virtual
    weeks: Week[][];
  };

export interface Week {
  date: Date;
}
