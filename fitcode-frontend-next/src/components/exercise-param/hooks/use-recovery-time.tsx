import dayjs from 'dayjs';
import { useEffect } from 'react';

import { ExerciseParamFieldEnum } from '@/core/exercise/enum/exercise-param-field.enum';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';

export default function useRecoveryTime(
  selected: string,
  initValue: number | string | null,
  setValue: SetState<number | string>,
  trainingInProgressSecondaryItem?: boolean
) {
  const { activeTraining } = useMain();

  const { trainingInProgress } = useTrainings() || {};
  const { selectedExercise, setIndex, supersetIndex } =
    useTrainingInProgress() || {};

  const isRecTime = selected === ExerciseParamFieldEnum.REC_TIME;

  useEffect(() => {
    if (
      !isRecTime ||
      !trainingInProgressSecondaryItem ||
      !trainingInProgress ||
      !selectedExercise ||
      setIndex === undefined ||
      supersetIndex === undefined ||
      !activeTraining
    )
      return;

    const isSetCompleted = ExerciseSetService.isSetCompleted(
      {
        trainingId: trainingInProgress.training.id,
        componentId: trainingInProgress.selectedComponent.id,
        exerciseId: selectedExercise.id,
        supersetIndex: supersetIndex,
        setIndex: setIndex,
      },
      activeTraining.workloads
    );

    if (isSetCompleted) {
      setValue(initValue as number);
      return;
    }

    if (!activeTraining) return;

    const lastCompletedWorkload = ExerciseSetService.findLastCompletedWorkload(
      {
        trainingId: trainingInProgress.training.id,
        componentId: trainingInProgress.selectedComponent.id,
        exerciseId: selectedExercise.id,
      },
      activeTraining.workloads
    );

    if (!lastCompletedWorkload) {
      setValue(initValue as number);
      return;
    }

    const lastSetCompletedAt = lastCompletedWorkload.timestamp;

    // here update every second and every second decrease value by 1 until 0
    const intervalId: NodeJS.Timeout = setInterval(() => {
      setValue(() => {
        const elapsedSinceLastSet = Math.max(
          0,
          Math.floor(dayjs().diff(dayjs(lastSetCompletedAt), 'second'))
        );

        const remaining = Math.max(
          0,
          (initValue as number) - elapsedSinceLastSet
        );

        if (remaining <= 0) return 0;

        return remaining;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRecTime, selectedExercise, setIndex]);
}
