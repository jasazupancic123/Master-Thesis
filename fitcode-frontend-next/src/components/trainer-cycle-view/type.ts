import { TrainingController } from '@/controller/training/training.controller';

export type CreateTraining = Parameters<typeof TrainingController.create>[1];

export type AddTrainingComponents = Parameters<
  typeof TrainingController.addComponents
>[2];

export type UpdateTrainingComponents = Parameters<
  typeof TrainingController.updateComponent
>[3];

export type DeleteTrainingComponent = Parameters<
  typeof TrainingController.deleteComponent
>[3];
