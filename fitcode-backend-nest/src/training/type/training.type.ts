import { ExerciseMeta } from '../entity/exercise-meta.entity';
import { Training } from '../entity/training.entity';

export type CreateTraining = Pick<
  Training,
  'groupId' | 'cycleId' | 'from' | 'to' | 'components'
>;

export type UpdateTraining = Partial<
  Pick<Training, 'membersIds' | 'from' | 'to' | 'components'>
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
        meta: ExerciseMeta;
      }[];
    }[];
  }[];
};
