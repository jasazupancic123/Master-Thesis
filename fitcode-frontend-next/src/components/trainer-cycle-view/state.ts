import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Training } from '@/controller/training/type/training.type';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import {
  AddTrainingComponents,
  UpdateTrainingComponents,
  DeleteTrainingComponent,
} from './type';
import { CommonService } from '@/common/service/common.service';

export async function handleCreateTraining(
  token: string,
  date: Dayjs,
  period: 'AM' | 'PM',
  selectedGroup: Group,
  setTrainings: SetState<Training[]>,
  selectedCycle: Cycle,
  selectedComponents: Component[],
  setSelectedComponents: SetState<Component[]>,
  components: Component[],
  trainings: Training[]
) {
  if (!selectedComponents.length)
    return toast.error('Select at least one component to add');

  //get number of trainings in the selected period
  const periodTrainings = trainings.filter((training) => {
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

  if (periodTrainings.length >= 1) {
    toast.error('You can only create 1 trainings per period');
    return;
  }

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
    () =>
      TrainingController.create(token, {
        groupId: selectedGroup.id,
        cycleId: selectedCycle.id,
        from: from.toDate(),
        to: to.toDate(),
        components: selectedComponents.reduce(
          (acc, c, i) => {
            acc[c.id] = {
              id: c.id,
              order: i,
              supersets: [{ exercises: {}, order: 0 }],
            };

            return acc;
          },
          {} as Record<string, any>
        ),
      }),
    (training) => {
      const mapped = TrainingService.mapComponents(training, components);
      setTrainings((prev) => [...prev, mapped]);
      setSelectedComponents([]);
      toast.success('Training created successfully');
    },
    undefined,
    'Failed to create training'
  );
}

export async function handleAddTrainingComponents(
  token: string,
  trainingId: string,
  input: AddTrainingComponents,
  setTrainings: SetState<Training[]>,
  components: Component[]
) {
  handleApiRequest(
    () => {
      if (!input.components.length) {
        return Promise.reject('Select at least one component to add');
      }
      return TrainingController.addComponents(token, trainingId, input); // Ensure a Promise is always returned
    },
    (training) => {
      // Update training
      TrainingService.mapComponents(training, components);
      setTrainings((prev) =>
        prev.map((t) => (t.id === trainingId ? training : t))
      );
    },
    undefined,
    !input.components.length
      ? 'Select at least one component to add'
      : 'Failed to add training components'
  );
}

export async function handleUpdateTrainingComponent(
  token: string,
  trainingId: string,
  componentId: string,
  input: UpdateTrainingComponents,
  setTrainings: SetState<Training[]>,
  components: Component[]
) {
  handleApiRequest(
    () =>
      TrainingController.updateComponent(token, trainingId, componentId, input),
    (training) => {
      // update training
      TrainingService.mapComponents(training, components);
      setTrainings((prev) =>
        prev.map((t) => {
          if (t.id === trainingId) return training;
          return t;
        })
      );
    },
    undefined,
    'Failed to update training component'
  );
}

export async function handleDeleteTrainingComponent(
  trainingId: string,
  componentId: string,
  token: string,
  input: DeleteTrainingComponent,
  setTrainings: SetState<Training[]>,
  components: Component[]
) {
  handleApiRequest(
    () =>
      TrainingController.deleteComponent(token, trainingId, componentId, input),
    (training) => {
      // update training
      TrainingService.mapComponents(training, components);
      if (Object.keys(training.components).length === 0) {
        TrainingController.delete(token, trainingId);
        setTrainings((prev) => prev.filter((t) => t.id !== trainingId));
        toast.success('Training deleted successfully');
        return;
      }
      setTrainings((prev) =>
        prev.map((t) => {
          if (t.id === trainingId) return training;
          return t;
        })
      );
    },
    undefined,
    'Failed to delete training component'
  );
}

export async function handleDeleteTraining(
  trainingId: string,
  token: string,
  setTrainings: SetState<Training[]>
) {
  handleApiRequest(
    () => TrainingController.delete(token, trainingId),
    () => {
      // update training
      setTrainings((prev) => prev.filter((t) => t.id !== trainingId));
    },
    undefined,
    'Failed to delete training'
  );
}
