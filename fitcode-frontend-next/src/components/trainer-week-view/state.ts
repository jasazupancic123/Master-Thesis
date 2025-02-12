import { Cycle, Week } from '@/controller/group/type/cycle.type';
import { TrainingController } from '@/controller/training/training.controller';
import { Training } from '@/controller/training/type/training.type';
import dayjs from 'dayjs';
import { UpdateTrainingInput } from './type';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { TrainingService } from '@/controller/training/training.service';
import { Component } from '@/controller/component/type/component.type';

export function getWeek(weeks: Week[][], index: number) {
  return weeks[index];
}

export function getWeekStart(weeks: Week[][], index: number) {
  return dayjs(weeks[index][0].date)!.startOf('day');
}

export function getWeekEnd(weeks: Week[][], index: number) {
  return dayjs(weeks[index][6].date)!.endOf('day');
}

export async function updateTraining(
  token: string,
  training: Training,
  input: UpdateTrainingInput,
  selectedCycle: Cycle,
  setSelectedTrainings: SetState<Training[]>,
  components: Component[]
) {
  if (!selectedCycle) return;
  if (!Object.keys(input).length) return;

  handleApiRequest(
    () => TrainingController.update(token, training.id, input),
    (training) => {
      setSelectedTrainings((prev) =>
        prev.map((t) =>
          t.id === training.id
            ? TrainingService.mapComponents(training, components)
            : t
        )
      );
    },
    undefined,
    'Error when updating training'
  );
}
