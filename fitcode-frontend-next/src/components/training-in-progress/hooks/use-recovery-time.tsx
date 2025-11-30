import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { ExerciseParamFieldEnum } from '@/core/exercise/enum/exercise-param-field.enum';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';
import { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { Workload } from '@/core/training/type/workload.type';
import { INVALID_RECOVERY_TIME } from '@/components/training-in-progress/training-in-progress-exercise-header-card';

export default function useRecoveryTime(
  selected: string,
  initValue: number | string | null,
  setValue: SetState<number | string>,
  exercise: TrainingExercise
) {
  const { activeTraining } = useMain();

  const { trainingInProgress } = useTrainings() || {};
  const { setIndex, supersetIndex } = useTrainingInProgress() || {};

  const [lastCompletedWorkload, setLastCompletedWorkload] = useState<
    Workload | undefined
  >(undefined);

  useEffect(() => {
    if (!activeTraining || !trainingInProgress || !exercise) {
      setLastCompletedWorkload(undefined);
      return;
    }

    if (initValue === INVALID_RECOVERY_TIME) return;

    const lastCompletedWorkload = ExerciseSetService.findLastCompletedWorkload(
      {
        trainingId: trainingInProgress.training.id,
        componentId: trainingInProgress.selectedComponent.id,
        exerciseId: exercise.id,
        supersetIndex: supersetIndex,
      },
      activeTraining.workloads
    );

    setLastCompletedWorkload(lastCompletedWorkload);
  }, [trainingInProgress, activeTraining]);

  const isRecTime = selected === ExerciseParamFieldEnum.REC_TIME;

  useEffect(() => {
    if (initValue === INVALID_RECOVERY_TIME) return;

    if (
      !isRecTime ||
      !trainingInProgress ||
      !exercise ||
      setIndex === undefined ||
      supersetIndex === undefined ||
      !activeTraining
    )
      return;

    if (!activeTraining) return;

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
  }, [lastCompletedWorkload, isRecTime, exercise, setIndex]);
}
