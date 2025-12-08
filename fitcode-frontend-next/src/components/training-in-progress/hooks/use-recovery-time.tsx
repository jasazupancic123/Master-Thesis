import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { INVALID_RECOVERY_TIME } from '@/components/training-in-progress/training-in-progress-exercise-header-card';
import { ExerciseParamFieldEnum } from '@/core/exercise/enum/exercise-param-field.enum';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { Workload } from '@/core/training/type/workload.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';

export default function useRecoveryTime(
  selected: string,
  initValue: number | string | null,
  setValue: SetState<number | string>,
  exercise: TrainingExercise
) {
  const { activeTraining } = useMain();

  const { trainingInProgress } = useTrainings() || {};
  const { setIndex, supersetIndex, workloads } = useTrainingInProgress() || {};

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
        componentId: trainingInProgress.componentId,
        exerciseId: exercise.id,
        supersetIndex: supersetIndex,
      },
      workloads
    );

    setLastCompletedWorkload(lastCompletedWorkload);
  }, [trainingInProgress, activeTraining, workloads]);

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

    const lastSetCompletedAt = lastCompletedWorkload.from;

    // here update every second and every second decrease value by 1 until 0
    const intervalId: NodeJS.Timeout = setInterval(() => {
      setValue(() => {
        const elapsedSinceLastSet = Math.floor(
          dayjs().diff(dayjs(lastSetCompletedAt), 'second')
        );

        const remaining = (initValue as number) - elapsedSinceLastSet;

        return remaining;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [lastCompletedWorkload, isRecTime, exercise, setIndex, workloads]);
}
