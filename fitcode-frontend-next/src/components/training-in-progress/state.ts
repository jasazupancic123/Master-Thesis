import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Superset } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import toast from 'react-hot-toast';
import { AthleteTrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { TrainingController } from '@/controller/training/training.controller';
import {
  ExerciseOrTraining,
  ExerciseTrainingView,
} from '@/common/type/exercise-or-training.type';
import { User } from '@firebase/auth';

export const handleFinishTraining = async (state: {
  trainingInProgress: AthleteTrainingInProgress | null;
  setTrainingInProgress: SetState<AthleteTrainingInProgress | null>;
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
    () =>
      TrainingController.completeTrainingComponent(
        trainingInProgress.training.id,
        user.uid,
        trainingInProgress.selectedComponent.id,
        trainingInProgress.selectedComponent.component?.id ||
          trainingInProgress.selectedComponent.id,
        trainingInProgress.supersets
      ),
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
            }) as AthleteTrainingInProgress
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
