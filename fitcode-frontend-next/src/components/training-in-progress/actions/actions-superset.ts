import type { UseTrainingInProgressUtilsReturnType } from '../context/training-in.progress-utils.provider';
import type { UseUndoneExercisesReturnType } from '../context/undone-exercises.provider';
import { getUndoneExercises } from './actions-undone-exercises';
import type { Superset } from '@/controller/training/type/superset.type';
import type { TrainingProviderReturnTypeDefined } from '@/store/training.provider';
import type { TrainingInProgressProviderReturnType } from '@/store/training-in-progress.provider';

export function handleChangeSuperset(
  input: { superset: Superset; i: number },
  context: {
    useTraining: TrainingProviderReturnTypeDefined;
    useTrainingInProgress: TrainingInProgressProviderReturnType;
    useUndoneExercises: UseUndoneExercisesReturnType;
    useTrainingInProgressUtils: UseTrainingInProgressUtilsReturnType;
  }
) {
  const { superset, i } = input;

  const {
    useTraining,
    useTrainingInProgress,
    useUndoneExercises,
    useTrainingInProgressUtils,
  } = context;

  const { trainingInProgress, setTrainingInProgress } = useTraining;

  const { setSelectedSuperset, setSelectedExercise, setSetIndex } =
    useTrainingInProgress;

  const { setUndoneExercises } = useUndoneExercises;

  const { setShowUndoneSetsWarning } = useTrainingInProgressUtils;

  const undoneExercises = getUndoneExercises(
    trainingInProgress.supersets[trainingInProgress.supersetIndex ?? 0],
    trainingInProgress.supersetIndex ?? 0,
    trainingInProgress.exerciseSetTrackingState
  );

  if (undoneExercises.length > 0) {
    setUndoneExercises(undoneExercises);
    setShowUndoneSetsWarning(true);
  }

  setSelectedSuperset(superset);
  setSelectedExercise(superset.exercises[0] || null);
  setSetIndex(0);
  setTrainingInProgress((prev) =>
    prev && prev.supersetIndex !== i ? { ...prev, supersetIndex: i } : prev
  );
}
