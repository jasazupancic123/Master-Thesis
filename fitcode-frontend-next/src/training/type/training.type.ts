import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';
import { Dayjs } from 'dayjs';

export type FilterTrainingQuery = Partial<
  Pick<Training, 'groupId' | 'cycleId' | 'subgroupId' | 'from' | 'to'>
>;

export type CreateTraining = {
  groupId: string;
  cycleId: string;
  from: Dayjs;
  to: Dayjs;
  components: {
    [id: string]: TrainingComponent;
  };
};

export type UpdateTraining = Partial<Pick<Training, 'from' | 'to'>>;
