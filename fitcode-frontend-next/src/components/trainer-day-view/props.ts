import { SetExerciseOption } from '@/common/constant/training-exercise.constant';
import { Day } from '@/common/service/util/date.util';
import { SetState } from '@/common/type/state.type';
import {
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
  component: TrainingComponent;
}

export interface TrainingExerciseCardProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: Dispatch<SetStateAction<TrainingExercise | null>>;
  chartView?: boolean;
  superior?: { row: boolean; column: boolean; all: boolean };
  setOpenVideoPlayerModal: Dispatch<SetStateAction<boolean>>;
}

export interface SubgroupProps {
  showSubgroups: boolean;
}

export interface SupersetsProps {
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
}

export interface SetExerciseState {
  option: string;
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
}
