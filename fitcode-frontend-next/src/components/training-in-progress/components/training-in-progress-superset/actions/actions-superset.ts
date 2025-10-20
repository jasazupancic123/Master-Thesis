import { getUndoneExercises } from '@/components/training-in-progress/actions/actions-undone-exercises';
import type { UseTrainingInProgressUtilsReturnType } from '@/components/training-in-progress/context/training-in.progress-utils.provider';
import type { UseUndoneExercisesReturnType } from '@/components/training-in-progress/context/undone-exercises.provider';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { TrainingProviderReturnTypeDefined } from '@/store/training.provider';
import type { TrainingInProgressProviderReturnType } from '@/store/training-in-progress.provider';

export const handleFinishSuperset = (context: {
  useTraining: TrainingProviderReturnTypeDefined;
  useTrainingInProgress: TrainingInProgressProviderReturnType;
  useTrainingInProgressUtils: UseTrainingInProgressUtilsReturnType;
  useTrainingInProgressUndoneExercises: UseUndoneExercisesReturnType;
}) => {
  const {
    useTraining,
    useTrainingInProgress,
    useTrainingInProgressUtils,
    useTrainingInProgressUndoneExercises,
  } = context;

  const { trainingInProgress } = useTraining;

  const { selectedSuperset } = useTrainingInProgress;

  const { handleCloseMenu, handleCancelTraining, setShowUndoneSetsError } =
    useTrainingInProgressUtils;

  const { setUndoneExercises } = useTrainingInProgressUndoneExercises;

  if (!trainingInProgress?.supersets || !selectedSuperset) return;

  handleCloseMenu();

  const undoneExercises = [] as TrainingExercise[];

  trainingInProgress.supersets.forEach((superset, sIndex) => {
    const undoneExercisesForSuperset = getUndoneExercises(
      superset,
      sIndex,
      trainingInProgress.exerciseSetTrackingState
    );
    undoneExercisesForSuperset.forEach((exercise) => {
      if (!undoneExercises.find((e) => e.id === exercise.id))
        undoneExercises.push(exercise);
    });
  });

  if (undoneExercises.length > 0) {
    setUndoneExercises(undoneExercises);
    setShowUndoneSetsError(true);
    return;
  }

  handleCancelTraining();
};
