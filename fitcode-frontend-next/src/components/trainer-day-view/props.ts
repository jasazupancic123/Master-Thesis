import { SetExerciseOption } from '@/common/constant/training-exercise.constant';
import { Day } from '@/common/service/util/date.util';
import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import {
  ExerciseMeta,
  Superset,
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { Dispatch, SetStateAction } from 'react';

export interface TrainingCardProps {
  day: Day;
  training: Training;
  period: string;
}

export interface TrainingComponentProps {
  training: Training;
  trainingComponent: TrainingComponent;
}

export interface AddExerciseFormProps {
  selectedExercisesIds: string[];
  setSelectedExercisesIds: SetState<string[]>;
}

export interface TrainingExerciseCardProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: Dispatch<SetStateAction<TrainingExercise | null>>;
}

export interface SubgroupProps {
  showSubgroups: boolean;
}

export interface SupersetsProps {
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
}

export interface SetExerciseState {
  option: keyof ExerciseMeta;
  label: string;
  value: string;
  type: SetExerciseOption['type'];
  values?: SetExerciseOption['values'];
  format: SetExerciseOption['format'];
}

export interface SetExerciseAttributeProps {
  state: SetExerciseState;
  onChange: (data: SetExerciseState) => void;
  options: SetExerciseOption[];
  disabled?: boolean;
}
