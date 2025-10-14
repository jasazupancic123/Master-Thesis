import type { SetState } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export interface TrainingComponentProps {
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
  chartView?: boolean;
  superior?: { row: boolean; column: boolean; all: boolean };
}

export interface SubgroupProps {
  showSubgroups: boolean;
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
