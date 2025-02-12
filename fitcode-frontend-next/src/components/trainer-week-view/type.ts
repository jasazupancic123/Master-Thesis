import { TrainingController } from '@/controller/training/training.controller';
import { Training } from '@/controller/training/type/training.type';

export type UpdateTrainingInput = Parameters<
  typeof TrainingController.update
>[2];

export type TrainingWeekViewItemProps = {
  training: Training;
  updateTraining: (
    training: Training,
    input: UpdateTrainingInput
  ) => Promise<void>;
};
