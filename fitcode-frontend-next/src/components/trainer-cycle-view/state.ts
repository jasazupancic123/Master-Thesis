import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { AddTrainingComponents } from './type';
import { CommonService } from '@/common/service/common.service';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Method } from '@/controller/method/type/method.type';
import type { Target } from '@/controller/target/type/target.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { TrainingInfo } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

export async function handleCreateTraining(
  input: {
    group: Group;
    cycle: Cycle;
    date: Dayjs;
    period: 'AM' | 'PM';
    selectedComponents: TrainingComponent[];
  },
  state: {
    router: AppRouterInstance;
    trainings: TrainingInfo[];
    setTrainings: SetState<TrainingInfo[]>;
    setCycle: SetStateNullable<Cycle>;
    components: Component[];
    exercises: Exercise[];
    methods: Method[];
  }
) {
  const { group, cycle, date, period, selectedComponents } = input;
  const { router, trainings, setTrainings, components, exercises, methods } =
    state;

  if (!selectedComponents.length) return; // toast.error('Select at least one component to add');

  if (
    !CommonService.instance.date.isBetween(
      date,
      dayjs(cycle.from),
      dayjs(cycle.to)
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
      TrainingController.create({
        groupId: group.id,
        cycleId: cycle.id,
        components: selectedComponents,
        membersIds: [],
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

export async function handleAddTrainingComponents(
  input: AddTrainingComponents & { trainingId: string },
  state: {
    router: AppRouterInstance;
    setTrainings: SetState<TrainingInfo[]>;
    components: Component[];
    exercises: Exercise[];
    methods: Method[];
    selectedTargets: { componentId: string; target: Target }[];
  }
) {
  const { trainingId, ...restInput } = input;
  const {
    router,
    setTrainings,
    components,
    exercises,
    methods,
    selectedTargets,
  } = state;

  restInput.components.forEach((component) => {
    const selectedTarget = selectedTargets.find(
      (m) => m.componentId === component.id
    );
    if (selectedTarget) component.target = selectedTarget.target;
  });

  handleApiRequest(
    router,
    () =>
      !restInput.components.length
        ? // if outside box was clicked, delete the whole training
          TrainingController.delete(trainingId)
        : // else, add components
          TrainingController.addComponents(trainingId, restInput),
    (training) => {
      if (!training) {
        // training was deleted
        setTrainings((prev) => prev.filter((t) => t.id !== trainingId));
        toast.success('Training deleted successfully');
        return;
      }

      // add components to training
      TrainingService.mapData(training, {
        components,
        exercises,
        methods,
      });

      setTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );

      toast.success(
        restInput.components.length > 1
          ? 'Training components added successfully'
          : 'Training component added successfully'
      );
    },
    undefined,
    'Failed to add training components'
  );
}

export async function handleDeleteTrainingComponent(
  input: {
    trainingId: string;
    componentId: string;
  },
  state: {
    router: AppRouterInstance;
    setTrainings: SetState<TrainingInfo[]>;
    components: Component[];
    exercises: Exercise[];
    methods: Method[];
  }
) {
  const { trainingId, componentId } = input;
  const { router, setTrainings, components, exercises, methods } = state;

  handleApiRequest(
    router,
    () => TrainingController.deleteComponent(trainingId, componentId),
    (training) => {
      TrainingService.mapData(training, {
        components,
        exercises,
        methods,
      });

      if (training.components.length === 0) {
        // traning was deleted
        setTrainings((prev) => prev.filter((t) => t.id !== training.id));
      } else {
        setTrainings((prev) =>
          prev.map((t) => (t.id === trainingId ? training : t))
        );
      }
    },
    undefined,
    'Failed to delete training component'
  );
}
