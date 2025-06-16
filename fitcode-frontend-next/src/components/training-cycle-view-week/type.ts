import { SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Training } from '@/controller/training/type/training.type';
import { Dayjs } from 'dayjs';
import { AddTrainingComponents } from '../trainer-cycle-view/type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Target } from '@/controller/target/type/target.type';
import { TrainingMinimal } from '@/controller/training/type/training-minimal.type';
import { Day } from '@/common/service/util/date.util';

export type TrainingCycleViewWeekProps = TrainingCycleViewCommonProps & {
  index: number;
  week: Dayjs[];
  selected?: Component[];
  setSelected?: SetState<Component[]>;
  componentCalendarView?: boolean;
  periodizationView?: boolean;
  cycleView?: boolean;
  trainingComponent?: TrainingComponent;
  training?: Training;
  setOpenOverwriteModal?: SetState<boolean>;
  setTrainingInPeriodForModal?: SetState<TrainingMinimal | null>;
  handleCopyComponentApiRequest?: (
    trainingInPeriod: Training,
    component: TrainingComponent,
    overwrite?: boolean
  ) => Promise<void>;
  selectedTrainings?: TrainingMinimal[];
  setSelectedTrainings?: SetState<TrainingMinimal[]>;
  selectedTargets?: { componentId: string; target: Target }[];
  selectedTarget?: Target;
  copyComponent?: boolean;
  day?: Day;
  setTodaysTrainings?: SetState<Training[]>;
};

export type TrainingCycleViewGridItemProps = TrainingCycleViewCommonProps & {
  order: number;
  training: TrainingMinimal;
  trainingComponent?: TrainingComponent;
  componentCalendarView?: boolean;
  periodizationView?: boolean;
  cycleView?: boolean;
  isSameDayAsSelectedComponent?: boolean;
  selected?: boolean;
  selectedTrainings?: TrainingMinimal[];
  setSelectedTrainings?: SetState<TrainingMinimal[]>;
  basePeriodizationTraining?: Training;
  selectedTarget?: Target;
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
