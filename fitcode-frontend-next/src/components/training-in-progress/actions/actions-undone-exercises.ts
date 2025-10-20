import type { ExerciseSetTracking } from '@/core/training/type/exercise-set-tracking-state.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';

// returns how many sets are undone in current superset
export const getUndoneExercises = (
  superset: Superset | undefined,
  supersetIndex: number | undefined,
  exerciseSetTrackingState: ExerciseSetTracking[]
): TrainingExercise[] => {
  if (superset === undefined || supersetIndex === undefined) return [];

  const undoneExercises = [] as TrainingExercise[];

  superset.exercises.forEach((exercise) => {
    const tracking = exerciseSetTrackingState.find(
      (t) => t.exerciseId === exercise.id
    );
    exercise.sets.forEach((set) => {
      if (
        !tracking ||
        (!tracking.completedSetNumbers.includes(set.setNumber) &&
          !undoneExercises.find((e) => e.id === exercise.id))
      )
        undoneExercises.push(exercise);
    });
  });

  return undoneExercises;
};
