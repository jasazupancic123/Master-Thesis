import { TrainingController } from '@/controller/training/training.controller';

export type CreateTraining = Parameters<typeof TrainingController.create>[1];

export type AddTrainingComponents = Parameters<
  typeof TrainingController.addComponents
>[2];
