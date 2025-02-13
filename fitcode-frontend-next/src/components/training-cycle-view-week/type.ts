import { Training } from '@/controller/training/type/training.type';
import { Dayjs } from 'dayjs';
import { AddTrainingComponents } from '../trainer-cycle-view/type';
import { SetState } from '@/common/type/state.type';
import { Group } from '@/controller/group/type/group.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';

export type TrainingCycleViewWeekProps = TrainingCycleViewCommonProps & {
  index: number;
  week: Dayjs[];
  trainings: Training[];
  selected?: null | Component | TreeComponent | (Component | TreeComponent)[];
  setSelected?: SetState<TrainingCycleViewWeekProps['selected']>;
  token: string;
  group: Group;
  setSelectedTrainings: SetState<Training[]>;
  selectedCycle: Cycle;
  setSelectedComponents: SetState<Component[]>;
};

export type TrainingCycleViewGridItemProps = TrainingCycleViewCommonProps & {
  order: number;
  training: Training;
  components: Component[];
};

type TrainingCycleViewCommonProps = {
  components: Component[];
  addTrainingComponent: (
    trainingId: string,
    data: AddTrainingComponents
  ) => void;
  deleteTraining: (trainingId: string) => Promise<void>;
  deleteTrainingComponent: (
    trainingId: string,
    componentId: string
  ) => Promise<void>;
};
