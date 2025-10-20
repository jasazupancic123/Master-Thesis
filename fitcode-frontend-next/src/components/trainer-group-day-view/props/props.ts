import type { SetState } from '@/lib/common/type/state.type';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import type { AttributeValue } from '@/core/attribute/type/attribute-value.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';

export interface TrainingComponentProps {
  trainingComponent: TrainingComponent;
}

export interface AddExerciseFormProps {
  selectedExerciseIds: string[];
  setSelectedExerciseIds: SetState<string[]>;
  component: TrainingComponent;
}

export interface TrainingExerciseCardProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  chartView?: boolean;
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
