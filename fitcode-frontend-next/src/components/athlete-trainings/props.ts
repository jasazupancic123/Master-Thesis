import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';

export type AthleteTrainingExerciseCardProps = {
  token: string;
  userId: string;
  components: TrainingComponent[];
  training: Training;
};
