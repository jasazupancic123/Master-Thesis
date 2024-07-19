import { Group } from '@/type/group.type';
import { Dayjs } from 'dayjs';

export interface Week {
  date: Dayjs | null;
  trainings: any[];
}

export interface Cycle {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  startDate: Dayjs;
  endDate: Dayjs;

  // relations
  group?: Group;

  // virtual
  color?: string;
  weeks?: Week[][];
  isInRange?: (date: Dayjs) => boolean;
}

export type CreateCycle = Pick<Cycle, 'name' | 'startDate' | 'endDate'>