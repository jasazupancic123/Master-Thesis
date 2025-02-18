import { Training } from '../entity/training.entity';

export type CreateTraining = Pick<
  Training,
  'groupId' | 'cycleId' | 'from' | 'to'
> & {
  componentsIds: string[];
};

export type UpdateTraining = Pick<Training, 'components' | 'from' | 'to'>;
