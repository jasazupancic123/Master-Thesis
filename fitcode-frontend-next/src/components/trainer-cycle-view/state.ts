import { CommonService } from '@/common/service/common.service';
import {
  handleApiRequest,
  SetState,
  SetStateNullable,
} from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Training } from '@/controller/training/type/training.type';
import dayjs, { Dayjs } from 'dayjs';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { AddTrainingComponents } from './type';

export async function handleCreateTraining(
  token: string,
  input: {
    group: Group;
    cycle: Cycle;
    date: Dayjs;
    period: 'AM' | 'PM';
    selectedComponents: Component[];
  },
  state: {
    router: AppRouterInstance;
    setTrainings: SetState<Training[]>;
    filteredTrainings: Training[];
    setFilteredTrainings: SetState<Training[]>;
    setCycle: SetStateNullable<Cycle>;
    components: Component[];
  }
) {
  const { group, cycle, date, period, selectedComponents } = input;
  const {
    router,
    filteredTrainings,
    setTrainings,
    setFilteredTrainings,
    components,
  } = state;

  if (!selectedComponents.length) return; // toast.error('Select at least one component to add');

  // get number of trainings in the selected period
  const periodTrainings = filteredTrainings.filter((training) => {
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

  const amPair = { start: 8, end: 10 };
  const pmPair = { start: 14, end: 16 };
  const pair = period === 'AM' ? amPair : pmPair;

  // set start time and end time to date
  const from = date
    .set('year', date.year())
    .set('month', date.month())
    .set('date', date.date())
    .set('hour', pair.start)
    .set('minute', 0)
    .set('second', 0);

  const to = date
    .set('year', date.year())
    .set('month', date.month())
    .set('date', date.date())
    .set('hour', pair.end)
    .set('minute', 0)
    .set('second', 0);

  handleApiRequest(
    router,
    () =>
      TrainingController.create(token, {
        groupId: group.id,
        cycleId: cycle.id,
        from: from.toDate(),
        to: to.toDate(),
        componentsIds: selectedComponents.map(({ id }) => id),
      }),
    (training) => {
      const mapped = TrainingService.mapComponents(training, components);
      setTrainings((prev) => [...prev, mapped]);
      setFilteredTrainings((prev) => [...prev, mapped]);
      // toast.success('Training created successfully');
    },
    undefined,
    'Failed to create training'
  );
}

export async function handleAddTrainingComponents(
  token: string,
  input: AddTrainingComponents & { trainingId: string },
  state: {
    router: AppRouterInstance;
    training: Training | undefined;
    setTraining: SetStateNullable<Training>;
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
    components: Component[];
  }
) {
  const { trainingId, ...restInput } = input;
  const {
    router,
    training: selectedTraining,
    setTraining,
    setFilteredTrainings,
    setTrainings,
    components,
  } = state;

  if (!restInput.componentsIds.length)
    return toast.error('Select at least one component to add');

  handleApiRequest(
    router,
    () => TrainingController.addComponents(token, trainingId, restInput),
    (training) => {
      const mapped = TrainingService.mapComponents(training, components);
      if (training.id === selectedTraining?.id) setTraining(mapped);

      setTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? mapped : t))
      );

      setFilteredTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? mapped : t))
      );
    },
    undefined,
    'Failed to add training components'
  );
}

export async function handleDeleteTrainingComponent(
  token: string,
  input: {
    trainingId: string;
    componentId: string;
  },
  state: {
    router: AppRouterInstance;
    training: Training | undefined;
    setTraining: SetStateNullable<Training>;
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
    components: Component[];
  }
) {
  const { trainingId, componentId } = input;
  const {
    router,
    setTrainings,
    setFilteredTrainings,
    training: selectedTraining,
    setTraining,
    components,
  } = state;

  handleApiRequest(
    router,
    () => TrainingController.deleteComponent(token, trainingId, componentId),
    (training) => {
      const mapped = TrainingService.mapComponents(training, components);

      if (mapped.components.length === 0) {
        // traning was deleted
        if (training.id === selectedTraining?.id) setTraining(undefined);
        setTrainings((prev) => prev.filter((t) => t.id !== training.id));
        setFilteredTrainings((prev) =>
          prev.filter((t) => t.id !== training.id)
        );
      } else {
        if (training.id === selectedTraining?.id) setTraining(mapped);
        setTrainings((prev) =>
          prev.map((t) => (t.id === trainingId ? mapped : t))
        );

        setFilteredTrainings((prev) =>
          prev.map((t) => (t.id === trainingId ? mapped : t))
        );
      }

      // toast.success('Training component deleted successfully');
    },
    undefined,
    'Failed to delete training component'
  );
}
