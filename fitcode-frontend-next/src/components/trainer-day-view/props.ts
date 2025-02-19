import { Day } from '@/common/service/util/date.util';
import { SetState } from '@/common/type/state.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import {
  ExerciseMeta,
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';

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
  exercise: TrainingExercise;
  onChange: (data: Partial<ExerciseMeta>) => void;
}

export interface SubgroupProps {
  showSubgroups: boolean;
}

export interface SupersetsProps {
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
}
