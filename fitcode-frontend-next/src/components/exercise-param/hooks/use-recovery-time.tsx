import dayjs from 'dayjs';
import { useEffect } from 'react';

import { ExerciseParamFieldEnum } from '@/core/exercise/enum/exercise-param-field.enum';
import { STRING_CONST } from '@/lib/common/const/string.const';
import type { SetState } from '@/lib/common/type/state.type';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function useRecoveryTime(
  selected: string,
  initValue: number | string | null,
  setValue: SetState<number | string>,
  trainingInProgressSecondaryItem?: boolean
) {
  const { trainingInProgress } = useTraining() || {};
  const { selectedExercise, setIndex } = useTrainingInProgress() || {};

  const isRecTime = selected === ExerciseParamFieldEnum.REC_TIME;

  useEffect(() => {
    if (
      !isRecTime ||
      !trainingInProgressSecondaryItem ||
      !trainingInProgress ||
      !selectedExercise ||
      setIndex === undefined
    )
      return;

    const exerciseTracking = trainingInProgress?.exerciseSetTrackingState.find(
      (est) => est.exerciseId === selectedExercise.id
    );

    const isSetCompleted = exerciseTracking?.completedSetNumbers.some(
      (csn) => csn.setNumber === setIndex + 1
    );

    if (isSetCompleted) {
      setValue(initValue as number);
      return;
    }

    const lastCompletedSet = exerciseTracking?.completedSetNumbers.sort(
      (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
    )[0];

    if (!lastCompletedSet) return;

    const lastSetCompletedAt = lastCompletedSet.timestamp;

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

        if (remaining <= 0) return STRING_CONST.doIt;

        return remaining;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRecTime, selectedExercise, setIndex]);
}
