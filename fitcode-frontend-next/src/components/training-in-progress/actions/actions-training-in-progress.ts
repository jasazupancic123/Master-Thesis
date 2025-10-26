import dayjs from 'dayjs';

import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { ITrainingContextDefined } from '@/store/training.provider';
import type { ITrainingInProgressContext } from '@/store/training-in-progress.provider';
import { SupersetRecording } from '@/core/training/type/superset.type';

export function handleInitTrainingInProgressComponent(context: {
  useTraining: ITrainingContextDefined;
  useTrainingInProgressContext: ITrainingInProgressContext;
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

  if (!newTrainingInProgress.startOfTraining) {
    newTrainingInProgress.startOfTraining = dayjs();
  }

  if (!newTrainingInProgress.supersets) {
    newTrainingInProgress.supersets =
      newTrainingInProgress.selectedComponent.supersets;
  }

  const component =
    newTrainingInProgress.selectedComponent ||
    [
      newTrainingInProgress.training.warmup,
      ...newTrainingInProgress.training.components,
      newTrainingInProgress.training.cooldown,
    ].find((c) => c.id === newTrainingInProgress.selectedComponent?.id);

  if (!component) return;

  let newSelectedSuperset: SupersetRecording | undefined = undefined;

  if (!newTrainingInProgress.supersetIndex) {
    newTrainingInProgress.supersetIndex = 0;
    newSelectedSuperset = component.supersets[0];
  } else {
    newSelectedSuperset =
      component.supersets[newTrainingInProgress.supersetIndex || 0];
  }

  setSelectedSuperset(newSelectedSuperset);

  if (!selectedExercise) {
    setSelectedExercise(newSelectedSuperset?.exercises[0] || null);
    setSetIndex(0);
  }

  setTrainingInProgress((prev) => {
    return {
      ...prev,
      selectedComponent: component,
      supersets: component.supersets,
      startOfTraining: newTrainingInProgress.startOfTraining,
      supersetIndex: newTrainingInProgress.supersetIndex,
    } as TrainingInProgress;
  });
}
