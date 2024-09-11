import { Training } from '../entity/training.entity';
import { Dayjs } from 'dayjs';

export type FilterTrainingQuery = Pick<Training, 'subgroupId' | 'from' | 'to'>;

export type CreateTraining = {
  componentIds: string[],
  from: Dayjs,
  to: Dayjs,
  subgroupId: string | null,
}

export type UpdateTraining = Partial<CreateTraining>;
