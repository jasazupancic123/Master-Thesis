import { ExerciseParamFieldEnum } from '@/core/exercise/enum/exercise-param-field.enum';
import { lib } from '@/lib';
import { STRING_CONST } from '@/lib/common/const/string.const';
import { SetState } from '@/lib/common/type/state.type';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTraining } from '@/store/training.provider';
import dayjs from 'dayjs';
import { useEffect } from 'react';

export default function useRecoveryTime(
  selected: string,
  initValue: number | string | null,
  setValue: SetState<number | string>,
  trainingInProgressSecondaryItem?: boolean
) {
  const { trainingInProgress } = useTraining() || {};
  const { selectedExercise, setIndex, audioEnabled } =
    useTrainingInProgress() || {};

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
    let intervalId: NodeJS.Timeout;

    intervalId = setInterval(() => {
      setValue(() => {
        const elapsedSinceLastSet = Math.max(
          0,
          Math.floor(dayjs().diff(dayjs(lastSetCompletedAt), 'second'))
        );

        const remaining = Math.max(
          0,
          (initValue as number) - elapsedSinceLastSet
        );

        if (audioEnabled) {
          if (remaining === 22) {
            const indexOfMinus =
              selectedExercise.exercise?.name.indexOf('-') || -1;

            const exerciseName = selectedExercise.exercise?.name
              ? selectedExercise.exercise?.name.substring(0, indexOfMinus)
              : 'the exercise';

            const text = '20 seconds remaining for ' + exerciseName;

            lib.common.textToSpeech.speak(text);
          }
        }

        if (remaining <= 0) return STRING_CONST.doIt;

        return remaining;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRecTime, selectedExercise, setIndex, audioEnabled]);
}
