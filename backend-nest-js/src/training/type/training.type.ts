import { Training } from '../entity/training.entity';

export type CreateTraining = Pick<
  Training,
  'groupId' | 'ownerId' | 'subgroupId' | 'from' | 'to' | 'copiedFromId'
> & {
  componentIds: string[];
};

export type UpdateTraining = Partial<
  Pick<Training, 'membersIds' | 'from' | 'to'>
>;
