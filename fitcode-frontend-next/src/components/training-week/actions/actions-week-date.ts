import { addMinutes, setHours, setMinutes } from 'date-fns';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import { COLOR } from '@/common/constant/color.constant';
import { CommonService } from '@/common/service/common.service';
import { handleApiRequest, type SetState } from '@/common/type/state.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Target } from '@/controller/target/type/target.type';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { GroupProviderReturnType } from '@/store/group.provider';
import type { MainProviderReturnType } from '@/store/main.provider';

export async function handleClickDateCell(
  controller: TrainingController,
  input: {
    router: AppRouterInstance;
    date: Dayjs;
    period: string;
    componentCalendarView?: boolean;
    periodizationView?: boolean;
    copyComponent?: boolean;
    trainingComponent?: TrainingComponent;
    selected?: Component[];
    selectedTargets?: {
      componentId: string;
      target: Target;
    }[];
    setOpenOverwriteModal?: SetState<boolean>;
    setTrainingInPeriodForModal?: SetState<Training | null>;
  },
  context: {
    useMain: MainProviderReturnType;
    useGroup: GroupProviderReturnType;
  }
) {
  const {
    router,
    date,
    period,
    componentCalendarView,
    periodizationView,
    selected,
    selectedTargets,
    trainingComponent,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
  } = input;

  const { useGroup } = context;

  const { cycle, trainings } = useGroup;

  if (componentCalendarView) {
    const trainingInPeriod = trainings.find((t) => {
      const trainingDate = dayjs(t.from);
      return (
        trainingDate.isSame(date, 'day') && trainingDate.format('A') === period
      );
    });
    const trainingInPeriodIncludesComponent = trainingInPeriod?.components.find(
      (c) => c.component?.id === trainingComponent?.component?.id
    );

    if (trainingInPeriod && !trainingInPeriodIncludesComponent) {
      // ADD THE SELECTED TRAINING COMPONENT TO THE TRAINING
    } else if (trainingInPeriod && trainingInPeriodIncludesComponent) {
      // ASK USER IF OVERWRITE THE TRAINING COMPONENT
      if (setOpenOverwriteModal && setTrainingInPeriodForModal) {
        setTrainingInPeriodForModal(trainingInPeriod);
        setOpenOverwriteModal(true);
      }
    } else if (!trainingInPeriod) {
      // ADD A NEW TRAINING WITH THE SELECTED TRAINING COMPONENT
    }
  } else if (periodizationView) {
    // do nothing
    return;
  } else {
    if (
      !cycle ||
      !CommonService.instance.date.isBetween(date, cycle.from, cycle.to)
    )
      return;

    handleAddTraining(
      controller,
      {
        date,
        period: period as 'AM' | 'PM',
        selected,
        selectedTargets,
        router,
      },
      context
    );
  }
}

export function getFilteredTrainings(
  input: { date: dayjs.Dayjs },
  state: {
    periodizationView?: boolean;
    trainingComponent?: TrainingComponent;
    trainings: Training[];
    selectedTrainings?: Training[];
    date: Dayjs;
    selected?: Component[];
    period: string;
  }
) {
  let { date } = input;
  const {
    periodizationView,
    trainingComponent,
    trainings,
    selectedTrainings,
    period,
  } = state;

  if (periodizationView && selectedTrainings) {
    return trainings.filter((training_) => {
      const trainingDate = dayjs(training_.from);
      const start = trainingDate.startOf('day');
      const end = dayjs(training_.to).endOf('day');

      // Check if training falls within the given day
      const isBetween = CommonService.instance.date.isBetween(date, start, end);
      if (!isBetween) return false;

      // Apply AM/PM filtering
      if (period === 'AM') return trainingDate.hour() < 12; // Before noon
      if (period === 'PM') return trainingDate.hour() >= 12; // Noon or later

      return false;
    });
  }

  date = dayjs(date);

  const newFilteredTrainings = [];
  let colorIndex = 0;
  const evaluatedTrainingIds: { trainingId: string; colorIndex: number }[] = [];
  for (const ft of trainings) {
    for (const tc of ft.components) {
      if (!tc.copiedFrom) continue;
      const copiedFromTraining = trainings.find(
        (t) => t.id === tc.copiedFrom?.rootCopiedFromTrainingId
      );

      if (!copiedFromTraining) continue;
      const evaluatedTrainingId = evaluatedTrainingIds.find(
        (t) => t.trainingId === copiedFromTraining.id
      );

      if (evaluatedTrainingId) tc.color = COLOR[evaluatedTrainingId.colorIndex];
      else {
        evaluatedTrainingIds.push({
          trainingId: copiedFromTraining.id,
          colorIndex,
        });

        const rootTrainingComponent = copiedFromTraining.components.find(
          (c) => trainingComponent?.component?.id === c.component?.id
        );

        if (!rootTrainingComponent) continue;

        rootTrainingComponent.color = COLOR[colorIndex];
        tc.color = COLOR[colorIndex];
        colorIndex++;
      }
    }
    newFilteredTrainings.push(ft);
  }

  return newFilteredTrainings.filter((training) => {
    const trainingDate = dayjs(training.from);
    const start = trainingDate.startOf('day');
    const end = dayjs(training.to).endOf('day');

    // Check if training falls within the given day
    const isBetween = CommonService.instance.date.isBetween(date, start, end);
    if (!isBetween) return false;

    // Apply AM/PM filtering
    if (period === 'AM') return trainingDate.hour() < 12; // Before noon
    if (period === 'PM') return trainingDate.hour() >= 12; // Noon or later

    return false;
  });
}

function handleAddTraining(
  controller: TrainingController,
  input: {
    router: AppRouterInstance;
    date: Dayjs;
    period: 'AM' | 'PM';
    selected?: Component[];
    selectedTargets?: {
      componentId: string;
      target: Target;
    }[];
  },
  context: {
    useGroup: GroupProviderReturnType;
    useMain: MainProviderReturnType;
  }
) {
  const { date, period, selected, selectedTargets, router } = input;

  if (!selected) {
    toast.error('Please select at least one component to add');
    return;
  }

  const from = setMinutes(setHours(date.toDate(), period === 'AM' ? 8 : 14), 0);

  handleCreateTraining(
    controller,
    {
      router,
      date,
      period,
      from,
      selectedComponents: selected.map((c, i) => ({
        id: c.id,
        subgroups: [],
        supersets: [],
        mainSet: MainSet.BLOCK,
        from: addMinutes(from, i * 30),
        to: addMinutes(addMinutes(from, i * 30), 30),
        target: selectedTargets?.find((m) => m.componentId === c.id)?.target,
      })),
    },
    context
  );
}

async function handleCreateTraining(
  controller: TrainingController,
  input: {
    router: AppRouterInstance;
    date: Dayjs;
    from: Date;
    period: 'AM' | 'PM';
    selectedComponents: TrainingComponent[];
  },
  context: {
    useGroup: GroupProviderReturnType;
    useMain: MainProviderReturnType;
  }
) {
  const { router, date, from, period, selectedComponents } = input;

  const { useGroup, useMain } = context;

  const { components, exercises, methods } = useMain;

  const { group, cycle, trainings, setTrainings } = useGroup;

  if (!selectedComponents.length) return; // toast.error('Select at least one component to add');

  if (
    !CommonService.instance.date.isBetween(
      date,
      dayjs(cycle!.from),
      dayjs(cycle!.to)
    )
  )
    return toast.error('Selected date is not within the cycle');

  // get number of trainings in the selected period
  const periodTrainings = trainings.filter((training) => {
    const trainingDate = dayjs(training.from);
    const start = trainingDate.startOf('day');
    const end = dayjs(training.to).endOf('day');

    // check if training falls within the given day
    const isBetween = CommonService.instance.date.isBetween(date, start, end);
    if (!isBetween) return false;

    // apply AM/PM filtering
    if (period === 'AM') return trainingDate.hour() < 12; // before noon
    if (period === 'PM') return trainingDate.hour() >= 12; // noon or later

    return false;
  });

  if (periodTrainings.length >= 1)
    return toast.error('You can only create 1 trainings per period');

  handleApiRequest(
    router,
    () =>
      controller.create({
        groupId: group.id,
        cycleId: cycle!.id,
        components: selectedComponents,
        membersIds: [],
        from,
      }),
    (training) => {
      TrainingService.mapData(training, {
        components,
        exercises,
        methods,
      });

      setTrainings((prev) => [...prev, training]);
      toast.success('Training created successfully');
    },
    undefined,
    'Failed to create training'
  );
}
