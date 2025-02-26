import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import {
  Training,
  TrainingStatus,
} from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';

export type AthleteTrainingExerciseCardProps = {
  components: TrainingComponent[];
  setView: (view: 'exercises' | 'training') => void;
  training: Training;
  profile: User;
  statuses: TrainingStatus[];
};
