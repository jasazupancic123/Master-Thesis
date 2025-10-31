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

  const { handleCloseMenu, handleCancelTraining, setShowUndoneSetsError } =
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

  await handleCancelTraining();
};
