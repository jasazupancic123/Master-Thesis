import { addMinutes, setHours, setMinutes } from 'date-fns';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { COLOR } from '@/core/const/color.const';
import { core } from '@/core/core.service';
import type { Component } from '@/core/exercise/type/component.type';
import type { Target } from '@/core/exercise/type/target.type';
import { MainSet } from '@/core/training/enum/main-set.enum';
import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import { type SetState } from '@/lib/common/type/state.type';
import type { IGroupCtx } from '@/store/group.provider';
import type { IMainContext } from '@/store/main.provider';

export async function handleClickDateCell(
  userId: string,
  input: {
    date: Dayjs;
    period: string;
    componentCalendarView?: boolean;
    periodizationView?: boolean;
    copyComponent?: boolean;
    trainingComponent?: TrainingComponent;
    selected?: Component[];
    selectedTargets?: { componentId: string; target: Target }[];
    setOpenOverwriteModal?: SetState<boolean>;
    setTrainingInPeriodForModal?: SetState<Training | null>;
  },
  groupCtx: IGroupCtx,
  mainCtx: IMainContext
) {
  const {
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

  const { cycle, trainings } = groupCtx;

  if (componentCalendarView) {
    const trainingInPeriod = trainings.find((t) => {
      const trainingDate = dayjs(t.from);
      return (
        trainingDate.isSame(date, 'day') && trainingDate.format('A') === period
      );
    });

    const trainingInPeriodIncludesComponent = trainingInPeriod?.components.find(
      (c) => c.id === trainingComponent?.id
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
    if (!cycle || !lib.common.date.isBetween(date, cycle.from, cycle.to))
      return;

    handleAddTraining(
      userId,
      { date, period: period as 'AM' | 'PM', selected, selectedTargets },
      groupCtx,
      mainCtx
    );
  }
}

export function getFilteredTrainings(
  date: dayjs.Dayjs,
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
      const isBetween = lib.common.date.isBetween(date, start, end);
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
          (c) => trainingComponent?.id === c.id
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
    const isBetween = lib.common.date.isBetween(date, start, end);
    if (!isBetween) return false;

    // Apply AM/PM filtering
    if (period === 'AM') return trainingDate.hour() < 12; // Before noon
    if (period === 'PM') return trainingDate.hour() >= 12; // Noon or later

    return false;
  });
}

function handleAddTraining(
  userId: string,
  input: {
    date: Dayjs;
    period: 'AM' | 'PM';
    selected?: Component[];
    selectedTargets?: { componentId: string; target: Target }[];
  },
  groupCtx: IGroupCtx,
  mainCtx: IMainContext
) {
  const { date, period, selected, selectedTargets } = input;

  if (!selected) {
    toast.error('Please select at least one component to add');
    return;
  }

  const from = setMinutes(setHours(date.toDate(), period === 'AM' ? 8 : 14), 0);

  handleCreateTraining(
    userId,
    {
      date,
      period,
      from,
      selectedComponents: selected.map((c, i) => ({
        id: c.field,
        subgroups: [],
        supersets: [],
        mainSet: MainSet.BLOCK,
        from: addMinutes(from, i * 30),
        to: addMinutes(addMinutes(from, i * 30), 30),
        targetId: selectedTargets?.find((m) => m.componentId === c.field)
          ?.target?.field as string,
      })),
    },
    groupCtx,
    mainCtx
  );
}

async function handleCreateTraining(
  userId: string,
  input: {
    date: Dayjs;
    from: Date;
    period: 'AM' | 'PM';
    selectedComponents: TrainingComponent[];
  },
  groupCtx: IGroupCtx,
  mainCtx: IMainContext
) {
  const { date, from, period, selectedComponents } = input;
  const { exercises } = mainCtx;
  const { group, cycle, trainings, setTrainings } = groupCtx;

  if (!selectedComponents.length) return; // toast.error('Select at least one component to add');

  if (!lib.common.date.isBetween(date, dayjs(cycle!.from), dayjs(cycle!.to)))
    return toast.error('Selected date is not within the cycle');

  // get number of trainings in the selected period
  const periodTrainings = trainings.filter((training) => {
    const trainingDate = dayjs(training.from);
    const start = trainingDate.startOf('day');
    const end = dayjs(training.to).endOf('day');

    // check if training falls within the given day
    const isBetween = lib.common.date.isBetween(date, start, end);
    if (!isBetween) return false;

    // apply AM/PM filtering
    if (period === 'AM') return trainingDate.hour() < 12; // before noon
    if (period === 'PM') return trainingDate.hour() >= 12; // noon or later

    return false;
  });

  if (periodTrainings.length >= 1)
    return toast.error('Only 1 training per period allowed');

  const state = { trainings: [...trainings] };
  const tempId = 'training-id';

  await lib.common.generic.optimisticUpdate(
    () => {
      // Optimistically add the new training to the state
      const temp = core.training.stub(userId, {
        id: tempId,
        groupId: group!.id,
        cycleId: cycle!.id,
        from,
        to: addMinutes(from, selectedComponents.length * 30),
        components: selectedComponents.map((c) =>
          core.training.component.stub(c.id)
        ),
      });

      setTrainings((prev) =>
        [...prev, temp].sort(
          (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()
        )
      );
    },
    (snapshot) => {
      setTrainings(snapshot.trainings);
    },
    async () =>
      await TrainingController.getInstance().create({
        institutionId: group!.institutionId,
        groupId: group.id,
        cycleId: cycle!.id,
        components: selectedComponents,
        membersIds: [],
        from,
      }),
    state,
    (training) => {
      TrainingService.mapData(training, { exercises });

      // update the training with the response from the server
      setTrainings((prev) =>
        [...prev.filter((t) => t.id !== tempId), training].sort(
          (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()
        )
      );

      toast.success('Training created successfully');
    }
  );
}
