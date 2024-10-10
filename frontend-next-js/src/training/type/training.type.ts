import { Training } from '../entity/training.entity';
import { Dayjs } from 'dayjs';

export type FilterTrainingQuery = Pick<Training, 'groupId' | 'cycleId' | 'subgroupId' | 'from' | 'to'>;

export type CreateTraining = {
  groupId: string,
  cycleId: string,
  componentIds: string[],
  from: Dayjs,
  to: Dayjs,
  subgroupId: string | null,
}

export type UpdateTraining = Partial<Pick<Training, 'from' | 'to'>>;
