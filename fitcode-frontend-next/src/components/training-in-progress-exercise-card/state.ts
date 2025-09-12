import type { ExerciseSetTracking } from '@/common/type/exercise-set-tracking-state.type';
import type { SetState } from '@/common/type/state.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';

export const isExerciseSetCompleted = (
  exerciseIdentifier: { exerciseId: string; supersetIndex: number },
  setNumber: number,
  exerciseSetTrackingState: ExerciseSetTracking[]
) => {
  for (const key of Array.from(exerciseSetTrackingState)) {
    if (
      key.exerciseId === exerciseIdentifier.exerciseId &&
      key.supersetIndex === exerciseIdentifier.supersetIndex
    )
      return key.completedSetNumbers.includes(setNumber);
  }
  return false;
};

export const markExerciseSetAsCompleted = (
  exerciseIdentifier: { exerciseId: string; supersetIndex: number },
  setNumber: number,
  exerciseSetTrackingState: ExerciseSetTracking[],
  setTrainingInProgress: SetState<TrainingInProgress | null>
) => {
  const key = Array.from(exerciseSetTrackingState).find(
    (k) =>
      k.exerciseId === exerciseIdentifier.exerciseId &&
      k.supersetIndex === exerciseIdentifier.supersetIndex
  );

  if (key) {
    const completedSets = key.completedSetNumbers || [];
    if (!completedSets.includes(setNumber)) {
      completedSets.push(setNumber);
      key.completedSetNumbers = completedSets;
    }
  } else
    exerciseSetTrackingState.push({
      ...exerciseIdentifier,
      completedSetNumbers: [setNumber],
    });

  setTrainingInProgress((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      exerciseSetTrackingState,
    } as TrainingInProgress;
  });
};

export const unmarkExerciseSetAsCompleted = (
  exerciseIdentifier: { exerciseId: string; supersetIndex: number },
  setNumber: number,
  exerciseSetTrackingState: ExerciseSetTracking[],
  setTrainingInProgress: SetState<TrainingInProgress | null>
) => {
  const key = Array.from(exerciseSetTrackingState).find(
    (k) =>
      k.exerciseId === exerciseIdentifier.exerciseId &&
      k.supersetIndex === exerciseIdentifier.supersetIndex
  );
  if (!key) return;

  const completedSets = key.completedSetNumbers || [];
  const index = completedSets.indexOf(setNumber);
  if (index > -1) {
    completedSets.splice(index, 1);
    key.completedSetNumbers = completedSets;
  }

  setTrainingInProgress((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      exerciseSetTrackingState,
    } as TrainingInProgress;
  });
};
