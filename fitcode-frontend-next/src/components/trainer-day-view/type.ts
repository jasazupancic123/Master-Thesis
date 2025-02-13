import { Day } from '@/common/service/util/date.util';
import { SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Group } from '@/controller/group/type/group.type';
import { TrainingController } from '@/controller/training/training.controller';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import {
  ExerciseMeta,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
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
  training: Training;
  users: User[];
  setTrainings: SetState<Training[]>;
  setModal: SetState<{ subgroup: boolean; editSubgroup: boolean }>;
  setEditedSubgroup: SetState<Subgroup | null>;
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
  training: Training | null;
  group: Group;
  users: User[];
};

export interface TrainingExerciseCardProps {
  exercise: TrainingExercise;
  onChange: (data: Partial<ExerciseMeta>) => void;
}

export interface TrainingCardProps {
  token: string;
  setSelectedTrainings: SetState<Training[]>;
  selectedTraining: Training | null;
  users: User[];
  setModal: SetState<{ subgroup: boolean; editSubgroup: boolean }>;
  setEditedSubgroup: (subgroup: any) => void;
  filteredExercises: FilteredExercises;
  setFilteredExercises: SetState<FilteredExercises>;
  components: Component[];
  training: Training;
  period: 'AM' | 'PM';
  exercises: Exercise[];
  day: Day;
}
