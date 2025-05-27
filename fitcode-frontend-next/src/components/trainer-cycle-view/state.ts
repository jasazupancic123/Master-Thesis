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
import { TrainingComponent } from '@/controller/training/type/training-plan.type';

export async function handleCreateTraining(
  token: string,
  input: {
    group: Group;
    cycle: Cycle;
    date: Dayjs;
    period: 'AM' | 'PM';
    selectedComponents: TrainingComponent[];
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

  if (
    !CommonService.instance.date.isBetween(
      date,
      dayjs(cycle.from),
      dayjs(cycle.to)
    )
  )
    return toast.error('Selected date is not within the cycle');

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

  handleApiRequest(
    router,
    () =>
      TrainingController.create(token, {
        training: {
          groupId: group.id,
          cycleId: cycle.id,
          components: selectedComponents,
        },
      }),
    (training) => {
      const mapped = TrainingService.mapComponents(training, components);
      setTrainings((prev) => [...prev, mapped]);
      setFilteredTrainings((prev) => [...prev, mapped]);
      toast.success('Training created successfully');
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
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
    components: Component[];
  }
) {
  const { trainingId, ...restInput } = input;
  const { router, setFilteredTrainings, setTrainings, components } = state;

  handleApiRequest(
    router,
    () =>
      !restInput.components.length
        ? // if outside box was clicked, delete the whole training
          TrainingController.delete(token, trainingId)
        : // else, add components
          TrainingController.addComponents(token, trainingId, restInput),
    (training) => {
      if (!training) {
        // training was deleted
        setTrainings((prev) => prev.filter((t) => t.id !== trainingId));
        setFilteredTrainings((prev) => prev.filter((t) => t.id !== trainingId));
        toast.success('Training deleted successfully');
        return;
      }

      // add components to training
      const mapped = TrainingService.mapComponents(training, components);
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
    setTrainings: SetState<Training[]>;
    setFilteredTrainings: SetState<Training[]>;
    components: Component[];
  }
) {
  const { trainingId, componentId } = input;
  const { router, setTrainings, setFilteredTrainings, components } = state;

  handleApiRequest(
    router,
    () => TrainingController.deleteComponent(token, trainingId, componentId),
    (training) => {
      const mapped = TrainingService.mapComponents(training, components);

      if (mapped.components.length === 0) {
        // traning was deleted
        setTrainings((prev) => prev.filter((t) => t.id !== training.id));
        setFilteredTrainings((prev) =>
          prev.filter((t) => t.id !== training.id)
        );
      } else {
        setTrainings((prev) =>
          prev.map((t) => (t.id === trainingId ? mapped : t))
        );

        setFilteredTrainings((prev) =>
          prev.map((t) => (t.id === trainingId ? mapped : t))
        );
      }
    },
    undefined,
    'Failed to delete training component'
  );
}
