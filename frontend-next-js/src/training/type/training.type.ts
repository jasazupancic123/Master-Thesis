import { Training } from '../entity/training.entity';

export type FilterTrainingQuery = Pick<Training, 'subgroupId' | 'from' | 'to'>;

export type CreateTraining = Pick<Training, 'subgroupId' | 'from' | 'to'> & {
  componentIds: string[];
}

export type UpdateTraining = Partial<CreateTraining>;
