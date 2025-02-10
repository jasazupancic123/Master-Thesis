import { Training } from '@/controller/training/type/training.type';
import { Dayjs } from 'dayjs';
import { AddTrainingComponents } from '../trainer-cycle-view/type';
import { Component } from '@/controller/component/type/component.type';

type CreateTraining = { from: Dayjs; to: Dayjs; date: Dayjs };

export type TrainingCycleViewWeekProps = TrainingCycleViewCommonProps & {
  index: number;
  week: Dayjs[];
  training: CreateTraining;
  trainings: Training[];
  addTraining: (data: CreateTraining) => void;
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
