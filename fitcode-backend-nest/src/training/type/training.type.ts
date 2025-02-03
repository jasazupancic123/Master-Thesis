import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';
import { Training } from '../entity/training.entity';

export type CreateTraining = Pick<
  Training,
  | 'groupId'
  | 'cycleId'
  | 'ownerId'
  | 'subgroupId'
  | 'from'
  | 'to'
  | 'copiedFromId'
> & {
  componentIds: string[];
};

export type UpdateTraining = Partial<
  Pick<Training, 'membersIds' | 'from' | 'to'>
>;

export type MappedTraining = Omit<Training, 'components'> & {
  components: {
    id: string;
    order: number;
    color?: string;
    supersets: {
      order: number;
      color?: string;
      exercises: {
        id: string;
        order: number;
        color?: string;
        meta: TrainingExerciseMeta;
      }[];
    }[];
  }[];
};
