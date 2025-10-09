import { getUndoneExercises } from '@/components/training-in-progress/actions/actions-undone-exercises';
import { UseUndoneExercisesReturnType } from '@/components/training-in-progress/hooks/use-undone-exercises';
import { UseTrainingInProgressUtilsReturnType } from '@/components/training-in-progress/hooks/use-utils';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { TrainingInProgressProviderReturnType } from '@/store/training-in-progress.provider';
import { TrainingProviderReturnTypeDefined } from '@/store/training.provider';

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
