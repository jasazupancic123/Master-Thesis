import type { ITrainingInProgressUtilsCtx } from '../context/training-in.progress-utils.provider';
import type { IUndoneExercisesCtx } from '../context/undone-exercises.provider';
import { core } from '@/core/core.service';
import type { Superset } from '@/core/training/type/superset.type';
import type {
  TrainingExercise,
  TrainingExerciseExtended,
} from '@/core/training/type/training-exercise.type';
import type { ITrainingContextDefined } from '@/store/training.provider';
import type { ITrainingInProgressContext } from '@/store/training-in-progress.provider';

export function handleChangeSuperset(
  input: { superset: Superset; i: number },
  context: {
    useTraining: ITrainingContextDefined;
    useTrainingInProgress: ITrainingInProgressContext;
    useUndoneExercises: IUndoneExercisesCtx;
  }
) {
  const { superset, i } = input;

  const { useTraining, useTrainingInProgress, useUndoneExercises } = context;

  const { trainingInProgress } = useTraining;
  const { setUndoneExercises } = useUndoneExercises;
  const { setSelectedExercise, setSetIndex, setSupersetIndex, supersetIndex } =
    useTrainingInProgress;

  const undoneExercises = core.training.superset.getUndoneExercises(
    trainingInProgress.supersets[supersetIndex ?? 0],
    trainingInProgress.exerciseSetTrackingState
  );

  const extendedUndoneExercises: TrainingExerciseExtended[] =
    undoneExercises.map((exercise) => ({
      ...exercise,
      componentId: trainingInProgress.selectedComponent.id,
      supersetIndex: supersetIndex || 0,
    }));

  if (undoneExercises.length > 0) {
    setUndoneExercises(extendedUndoneExercises);
  }

  setSupersetIndex(i);
  setSelectedExercise(superset.exercises[0] || null);
  setSetIndex(0);
}

export const handleFinishSuperset = async (context: {
  useTraining: ITrainingContextDefined;
  useTrainingInProgress: ITrainingInProgressContext;
  useTrainingInProgressUtils: ITrainingInProgressUtilsCtx;
  useUndoneExercises: IUndoneExercisesCtx;
}) => {
  const {
    useTraining,
    useTrainingInProgress,
    useTrainingInProgressUtils,
    useUndoneExercises,
  } = context;

  const { trainingInProgress } = useTraining;

  const { supersetIndex } = useTrainingInProgress;

  const { handleCloseMenu, handleCompleteTraining, setShowUndoneSetsError } =
    useTrainingInProgressUtils;

  const { setUndoneExercises } = useUndoneExercises;

  if (!trainingInProgress?.supersets) return;

  handleCloseMenu();

  const undoneExercises: TrainingExercise[] = [];

  trainingInProgress.supersets.forEach((superset) => {
    const undoneExercisesForSuperset =
      core.training.superset.getUndoneExercises(
        superset,
        trainingInProgress.exerciseSetTrackingState
      );

    undoneExercisesForSuperset.forEach((exercise) => {
      if (!undoneExercises.find((e) => e.id === exercise.id))
        undoneExercises.push(exercise);
    });
  });

  const extendedUndoneExercises: TrainingExerciseExtended[] =
    undoneExercises.map((exercise) => ({
      ...exercise,
      componentId: trainingInProgress.selectedComponent.id,
      supersetIndex: supersetIndex || 0,
    }));

  if (undoneExercises.length > 0) {
    setUndoneExercises(extendedUndoneExercises);
    setShowUndoneSetsError(true);
    return;
  }

  await handleCompleteTraining();
};

export const handleAdvanceInSuperset = (context: {
  useTraining: ITrainingContextDefined;
  useTrainingInProgress: ITrainingInProgressContext;
}) => {
  const { useTraining, useTrainingInProgress } = context;

  const { trainingInProgress, setTrainingInProgress } = useTraining;

  const {
    setSelectedExercise,
    setSetIndex,
    supersetIndex,
    setSupersetIndex,
    selectedExercise: exercise,
  } = useTrainingInProgress;

  if (!trainingInProgress || !exercise) return;

  if (supersetIndex === undefined) return;

  const currentSuperset =
    trainingInProgress.selectedComponent.supersets[supersetIndex];

  if (!currentSuperset) return;

  const exercisesInCurrentSuperset = currentSuperset.exercises;

  // Check if every set in the current superset is completed
  const allSetsCompleted = exercisesInCurrentSuperset.every((ex) => {
    const exerciseSetTracking =
      trainingInProgress.exerciseSetTrackingState.find(
        (s) => s.exerciseId === ex.id
      );

    if (!exerciseSetTracking) return false;

    return exerciseSetTracking.completedSetNumbers.length >= ex.sets.length;
  });

  if (allSetsCompleted) {
    // Move to next superset

    const isLastSuperset =
      supersetIndex ===
      trainingInProgress.selectedComponent.supersets.length - 1;

    if (isLastSuperset) return;

    const nextSuperset =
      trainingInProgress.selectedComponent.supersets[supersetIndex + 1];

    if (!nextSuperset) return;

    setTrainingInProgress((prev) => ({
      ...prev!,
      supersetIndex: supersetIndex + 1,
    }));
    setSelectedExercise(nextSuperset.exercises[0]);
    setSetIndex(0);
    setSupersetIndex(supersetIndex + 1);

    return;
  }

  const currentExerciseIndex = exercisesInCurrentSuperset.findIndex(
    (ex) => ex.id === exercise.id
  );

  if (currentExerciseIndex === -1) return;

  let j = 0;

  for (
    let i = currentExerciseIndex + 1;
    j < exercisesInCurrentSuperset.length;
    i++
  ) {
    j++;

    if (i >= exercisesInCurrentSuperset.length)
      i -= exercisesInCurrentSuperset.length;

    const currentExercise = exercisesInCurrentSuperset[i];

    if (!currentExercise) continue;

    const exerciseSetTracking =
      trainingInProgress.exerciseSetTrackingState.find(
        (s) => s.exerciseId === currentExercise.id
      );

    if (!exerciseSetTracking) continue;

    const hasCompletedAllSets =
      exerciseSetTracking.completedSetNumbers.length >=
      currentExercise.sets.length;

    if (hasCompletedAllSets) continue;

    let hasAdvanced = false;

    currentExercise.sets.forEach((set) => {
      if (hasAdvanced) return;

      if (
        !exerciseSetTracking.completedSetNumbers.find(
          (s) => s.setNumber === set.setNumber
        )
      ) {
        hasAdvanced = true;

        setSelectedExercise(currentExercise);
        setSetIndex(set.setNumber - 1);
      }
    });

    if (hasAdvanced) return;
  }
};
