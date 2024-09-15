import { Training } from '../entity/training.entity';

export type CreateTraining = Pick<Training, 'subgroupId' | 'from' | 'to'> & {
  componentIds: string[];
};
