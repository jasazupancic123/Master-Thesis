import { Group } from '@/type/group.type';
import { Dayjs } from 'dayjs';
import { Training } from '@/type/training.type';

export interface Week {
  date: Dayjs | null;
  trainings: Training[];
  isTrainingDay: boolean;
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
  trainings?: Training[];

  // virtual
  color?: string;
  weeks?: Week[][];
  isInRange?: (date: Dayjs) => boolean;
}

export type CreateCycle = Pick<Cycle, 'name' | 'startDate' | 'endDate'>