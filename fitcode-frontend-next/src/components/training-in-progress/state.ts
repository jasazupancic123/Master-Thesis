import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Superset } from '@/controller/training/type/superset.type';
import { Training } from '@/controller/training/type/training.type';
import toast from 'react-hot-toast';
import { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { TrainingController } from '@/controller/training/training.controller';
import {
  ExerciseOrTraining,
  ExerciseTrainingView,
} from '@/common/type/exercise-or-training.type';
import { User } from '@firebase/auth';
import { CompletedTrainingExercise } from '@/controller/training/type/completed-training.entity';

export const handleFinishTraining = async (state: {
  trainingInProgress: TrainingInProgress | null;
  setTrainingInProgress: SetState<TrainingInProgress | null>;
  user: User | null;
  router: AppRouterInstance;
  setTrainings: SetState<Training[]>;
  setAllTrainings: SetState<Training[]>;
  clearTrainingState: () => void;
  setSelectedSuperset: SetState<Superset | undefined>;
  setView: SetState<ExerciseOrTraining>;
}) => {
  const {
    trainingInProgress,
    setTrainingInProgress,
    user,
    router,
    setTrainings,
    setAllTrainings,
    clearTrainingState,
    setView,
    setSelectedSuperset,
  } = state;

  if (!trainingInProgress || !user || !trainingInProgress.selectedComponent)
    return toast.error('An error occurred');

  handleApiRequest(
    router,
    () => {
      const exercises: CompletedTrainingExercise[] =
        trainingInProgress.supersets.flatMap((s, supersetIndex) =>
          s.exercises.map((e) => ({
            id: e.id,
            sets: e.sets,
            supersetIndex,
          }))
        );

      return TrainingController.completeTrainingComponent(
        trainingInProgress.training.id,
        trainingInProgress.selectedComponent.component?.id ||
          trainingInProgress.selectedComponent.id,
        { userId: user.uid, exercises }
      );
    },
    (training) => {
      toast.success('Training data updated successfully');
      clearTrainingState();
      setView(ExerciseTrainingView.ExerciseView);
      setSelectedSuperset(undefined);
      if (trainingInProgress.training.id === training.id) {
        setTrainingInProgress(
          (prev) =>
            ({
              ...prev,
              training: training,
            }) as TrainingInProgress
        );
      }
      setTrainings((prev) =>
        prev.map((t) => {
          if (t.id === training.id) {
            return training; // Update the training data
          }
          return t;
        })
      );
      setAllTrainings((prev) =>
        prev.map((t) => {
          if (t.id === training.id) {
            return training; // Update the training data
          }
          return t;
        })
      );
    },
    undefined,
    'Failed to update training data'
  );
};
