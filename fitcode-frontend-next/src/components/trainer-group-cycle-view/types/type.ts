import type { Dayjs } from 'dayjs';

import type { Day } from '@/common/service/util/date.util';
import type { SetState } from '@/common/type/state.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Target } from '@/controller/target/type/target.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

export type TrainingCycleViewWeekProps = TrainingCycleViewCommonProps & {
  week: Dayjs[];
  selected?: Component[];
  setSelected?: SetState<Component[]>;
  componentCalendarView?: boolean;
  periodizationView?: boolean;
  cycleView?: boolean;
  trainingComponent?: TrainingComponent;
  training?: Training;
  setOpenOverwriteModal?: SetState<boolean>;
  setTrainingInPeriodForModal?: SetState<Training | null>;
  handleCopyComponentApiRequest?: (
    trainingInPeriod: Training,
    component: TrainingComponent,
    overwrite?: boolean
  ) => Promise<void>;
  selectedTrainings?: Training[];
  setSelectedTrainings?: SetState<Training[]>;
  selectedTargets?: { componentId: string; target: Target }[];
  selectedTarget?: Target;
  copyComponent?: boolean;
  day?: Day;
};

export type TrainingCycleViewGridItemProps = TrainingCycleViewCommonProps & {
  order: number;
  training: Training;
  trainingComponent?: TrainingComponent;
  componentCalendarView?: boolean;
  periodizationView?: boolean;
  cycleView?: boolean;
  isSameDayAsSelectedComponent?: boolean;
  selected?: boolean;
  selectedTrainings?: Training[];
  setSelectedTrainings?: SetState<Training[]>;
  basePeriodizationTraining?: Training;
  selectedTarget?: Target;
};

type TrainingCycleViewCommonProps = {
  addTrainingComponent: (
    trainingId: string,
    data: { components: TrainingComponent[] }
  ) => void;
  deleteTrainingComponent: (
    trainingId: string,
    componentId: string
  ) => Promise<void>;
};
