import { SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Training } from '@/controller/training/type/training.type';
import { Dayjs } from 'dayjs';
import { AddTrainingComponents } from '../trainer-cycle-view/type';

export type TrainingCycleViewWeekProps = TrainingCycleViewCommonProps & {
  index: number;
  week: Dayjs[];
  selected?: Component[];
  setSelected?: SetState<Component[]>;
};

export type TrainingCycleViewGridItemProps = TrainingCycleViewCommonProps & {
  order: number;
  training: Training;
};

type TrainingCycleViewCommonProps = {
  addTrainingComponent: (
    trainingId: string,
    data: AddTrainingComponents
  ) => void;
  deleteTrainingComponent: (
    trainingId: string,
    componentId: string
  ) => Promise<void>;
};
