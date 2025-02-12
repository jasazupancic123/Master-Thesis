import { SetState } from '@/common/type/state.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { TrainingController } from '@/controller/training/training.controller';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';

export type FilteredExercises = {
  show: boolean;
  componentId: string | null;
  superset: number;
  search: {
    name: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  data: Exercise[];
};

export type SubgroupsProps = {
  token: string;
  training: Training;
  setSelectedTraining: SetState<Training | null>;
  users: User[];
  setTrainings: SetState<Training[]>;
  setModal: SetState<{ subgroup: boolean; editSubgroup: boolean }>;
  setEditedSubgroup: SetState<Subgroup | null>;
  detectedSubgroupChanges: boolean;
  setDetectedSubgroupChanges: SetState<boolean>;
};

export type AddSubgroupInput = Parameters<
  typeof TrainingController.addSubgroup
>[2];

export type UpdateSubgroupInput = Parameters<
  typeof TrainingController.updateSubgroup
>[3];

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

export type TrainingMembersProps = {
  training: Training;
  users: User[];
};
