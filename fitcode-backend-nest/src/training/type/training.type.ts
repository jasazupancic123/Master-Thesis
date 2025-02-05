import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';
import { Training } from '../entity/training.entity';

export type CreateTraining = Pick<
  Training,
  | 'groupId'
  | 'cycleId'
  | 'from'
  | 'to'
  | 'copiedFromId'
  | 'components'
  | 'subgroups'
>;

export type UpdateTraining = Partial<
  Pick<Training, 'membersIds' | 'from' | 'to' | 'components' | 'subgroups'>
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
