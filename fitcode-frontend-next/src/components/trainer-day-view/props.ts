import { Day } from '@/common/service/util/date.util';
import { SetState } from '@/common/type/state.type';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import {
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
  day: Day;
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
  setsNumbers: { exerciseId: string; setsNumber: number }[];
  setSetsNumbers: SetState<{ exerciseId: string; setsNumber: number }[]>;
  setSupersets: SetState<Superset[]>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

export interface SubgroupProps {
  showSubgroups: boolean;
}

export interface SupersetsProps {
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

export interface SetExerciseState {
  field: string;
  label: string;
  value: string;
  type: string;
  name: string;
  typeChange?: boolean;
}

export interface SetExerciseAttributeProps {
  state: SetExerciseState;
  onChange: (data: AttributeValue) => void;
  options: Attribute[];
  expandedView: boolean;
}
