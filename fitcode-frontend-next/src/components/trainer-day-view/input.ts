import { TrainingController } from '@/controller/training/training.controller';

export type AddSubgroupInput = Parameters<
  typeof TrainingController.addSubgroup
>[2];

export type UpdateSubgroupsInput = Parameters<
  typeof TrainingController.updateSubgroups
>[2];

export type AddSupersetInput = Parameters<
  typeof TrainingController.addSuperset
>[3];

export type UpdateSupersetInput = Parameters<
  typeof TrainingController.updateSuperset
>[4];

export type DeleteSupersetInput = Parameters<
  typeof TrainingController.deleteSuperset
>[4];

export type AddExercisesInput = Parameters<
  typeof TrainingController.addExercises
>[4];

export type UpdateExerciseInput = Parameters<
  typeof TrainingController.updateExercise
>[5];

export type DeleteExerciseInput = Parameters<
  typeof TrainingController.deleteExercise
>[5];
