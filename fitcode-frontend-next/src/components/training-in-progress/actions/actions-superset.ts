import type { ITrainingInProgressUtilsCtx } from '../context/training-in.progress-utils.provider';
import type { IUndoneExercisesCtx } from '../context/undone-exercises.provider';
import { core } from '@/core/core.service';
import type { Superset } from '@/core/training/type/superset.type';
import type {
  TrainingExercise,
  TrainingExerciseExtended,
} from '@/core/training/type/training-exercise.type';
import type { TrainingProviderReturnTypeDefined } from '@/store/training.provider';
import type { ITrainingInProgressCtx } from '@/store/training-in-progress.provider';

export function handleChangeSuperset(
  input: { superset: Superset; i: number },
  context: {
    useTraining: TrainingProviderReturnTypeDefined;
    useTrainingInProgress: ITrainingInProgressCtx;
    useTrainingInProgressUtils: ITrainingInProgressUtilsCtx;
    useUndoneExercises: IUndoneExercisesCtx;
  }
) {
  const { superset, i } = input;

  const {
    useTraining,
    useTrainingInProgress,
    useTrainingInProgressUtils,
    useUndoneExercises,
  } = context;

  const { trainingInProgress, setTrainingInProgress } = useTraining;
  const { setUndoneExercises } = useUndoneExercises;
  const { setSelectedSuperset, setSelectedExercise, setSetIndex } =
    useTrainingInProgress;

  const { setShowUndoneSetsWarning } = useTrainingInProgressUtils;

  const undoneExercises = core.training.superset.getUndoneExercises(
    trainingInProgress.supersets[trainingInProgress.supersetIndex ?? 0],
    trainingInProgress.exerciseSetTrackingState
  );

  const extendedUndoneExercises: TrainingExerciseExtended[] =
    undoneExercises.map((exercise) => ({
      ...exercise,
      componentId: trainingInProgress.selectedComponent.id,
      supersetIndex: trainingInProgress.supersetIndex || 0,
    }));

  if (undoneExercises.length > 0) {
    setUndoneExercises(extendedUndoneExercises);
    setShowUndoneSetsWarning(true);
  }

  setSelectedSuperset(superset);
  setSelectedExercise(superset.exercises[0] || null);
  setSetIndex(0);
  setTrainingInProgress((prev) =>
    prev && prev.supersetIndex !== i ? { ...prev, supersetIndex: i } : prev
  );
}

export const handleFinishSuperset = (context: {
  useTraining: TrainingProviderReturnTypeDefined;
  useTrainingInProgress: ITrainingInProgressCtx;
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

  const { selectedSuperset } = useTrainingInProgress;

  const { handleCloseMenu, handleCancelTraining, setShowUndoneSetsError } =
    useTrainingInProgressUtils;

  const { setUndoneExercises } = useUndoneExercises;

  if (!trainingInProgress?.supersets || !selectedSuperset) return;

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
      supersetIndex: trainingInProgress.supersetIndex || 0,
    }));

  if (undoneExercises.length > 0) {
    setUndoneExercises(extendedUndoneExercises);
    setShowUndoneSetsError(true);
    return;
  }

  handleCancelTraining();
};
