import type { User } from '@firebase/auth';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { ExerciseOrTraining } from '@/common/type/exercise-or-training.type';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { CompletedTrainingExercise } from '@/controller/training/type/completed-training.entity';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';

export const handleFinishTraining = async (
  controller: TrainingController,
  state: {
    trainingInProgress: TrainingInProgress | null;
    setTrainingInProgress: SetState<TrainingInProgress | null>;
    user: User | null;
    router: AppRouterInstance;
    setTrainings: SetState<Training[]>;
    clearTrainingState: () => void;
    setSelectedSuperset: SetState<Superset | undefined>;
    setView: SetState<ExerciseOrTraining>;
    exercises: Exercise[];
  }
) => {
  const {
    trainingInProgress,
    setTrainingInProgress,
    user,
    router,
    setTrainings,
    clearTrainingState,
    setView,
    setSelectedSuperset,
    exercises,
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

      return controller.completeTrainingComponent(
        trainingInProgress.training.id,
        trainingInProgress.selectedComponent.component?.id ||
          trainingInProgress.selectedComponent.id,
        { userId: user.uid, exercises }
      );
    },
    (training) => {
      TrainingService.mapData(training, { exercises });

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
            return {
              group: t.group,
              institution: t.institution,
              cycle: t.cycle,
              ...training,
            }; // Update the training data
          }
          return t;
        })
      );
    },
    undefined,
    'Failed to update training data'
  );
};
