import dayjs from 'dayjs';

import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { TrainingProviderReturnTypeDefined } from '@/store/training.provider';
import type { ITrainingInProgressCtx } from '@/store/training-in-progress.provider';

export function handleInitTrainingInProgressComponent(context: {
  useTraining: TrainingProviderReturnTypeDefined;
  useTrainingInProgressContext: ITrainingInProgressCtx;
}) {
  const { useTraining, useTrainingInProgressContext } = context;

  const { trainingInProgress, setTrainingInProgress } = useTraining;

  const {
    setSelectedSuperset,
    selectedExercise,
    setSelectedExercise,
    setSetIndex,
  } = useTrainingInProgressContext;

  const newTrainingInProgress = { ...trainingInProgress };

  if (!newTrainingInProgress.supersets) {
    newTrainingInProgress.supersets =
      newTrainingInProgress.selectedComponent.supersets;
  }

  if (!newTrainingInProgress.startOfTraining) {
    newTrainingInProgress.startOfTraining = dayjs();
  }

  let selectedSuperset = undefined;

  if (!newTrainingInProgress.supersetIndex) {
    newTrainingInProgress.supersetIndex = 0;
    selectedSuperset = newTrainingInProgress.supersets[0];
  } else {
    selectedSuperset =
      newTrainingInProgress.supersets[newTrainingInProgress.supersetIndex || 0];
  }

  setSelectedSuperset(selectedSuperset);

  if (!selectedExercise) {
    setSelectedExercise(selectedSuperset?.exercises[0] || null);
    setSetIndex(0);
  }

  const component = [
    newTrainingInProgress.training.warmup,
    ...newTrainingInProgress.training.components,
    newTrainingInProgress.training.cooldown,
  ].find((c) => c.id === newTrainingInProgress.selectedComponent?.id);

  if (!component) return;

  setTrainingInProgress(
    (prev) =>
      ({
        ...prev,
        selectedComponent: component,
        supersets: component.supersets,
        startOfTraining: newTrainingInProgress.startOfTraining,
        supersetIndex: newTrainingInProgress.supersetIndex,
      }) as TrainingInProgress
  );
}
