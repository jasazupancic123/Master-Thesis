import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Training } from '@/controller/training/type/training.type';
import { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import {
  AddTrainingComponents,
  UpdateTrainingComponents,
  DeleteTrainingComponent,
} from './type';

export async function handleCreateTraining(
  token: string,
  data: { from: Dayjs; to: Dayjs; date: Dayjs },
  selectedGroup: Group,
  setTrainings: SetState<Training[]>,
  selectedCycle: Cycle,
  selectedComponents: Component[],
  setSelectedComponents: SetState<Component[]>,
  components: Component[]
) {
  if (!selectedComponents.length)
    return toast.error('Select at least one component');

  // set start time and end time to date
  const from = data.date
    .set('year', data.date.year())
    .set('month', data.date.month())
    .set('date', data.date.date())
    .set('hour', data.from.hour())
    .set('minute', data.from.minute())
    .set('second', data.from.second());

  const to = data.date
    .set('year', data.date.year())
    .set('month', data.date.month())
    .set('date', data.date.date())
    .set('hour', data.to.hour())
    .set('minute', data.to.minute())
    .set('second', data.to.second());

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
    () => TrainingController.addComponents(token, trainingId, input),
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
    'Failed to add training components'
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
