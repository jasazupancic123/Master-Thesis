import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity, ColorEntity } from '@/common/type/entity.type';
import { Periodization } from './periodization.type';

export type Cycle = BaseEntity &
  ColorEntity &
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
