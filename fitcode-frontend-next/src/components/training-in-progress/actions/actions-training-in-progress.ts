import dayjs from 'dayjs';

import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { ITrainingsContextDefined } from '@/store/trainings.provider';
import type { ITrainingInProgressContext } from '@/store/training-in-progress.provider';

export function handleInitTrainingInProgressComponent(context: {
  useTraining: ITrainingsContextDefined;
  useTrainingInProgressContext: ITrainingInProgressContext;
}) {
  const { useTraining, useTrainingInProgressContext } = context;

  const { trainingInProgress, setTrainingInProgress } = useTraining;

  const {
    selectedExercise,
    setSelectedExercise,
    setSetIndex,
    supersetIndex,
    setSupersetIndex,
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
    newTrainingInProgress.training.components.find(
      (c) => c.id === newTrainingInProgress.selectedComponent?.id
    );

  if (!component) return;

  let newSelectedSuperset: Superset | undefined = undefined;

  if (supersetIndex === undefined) {
    newSelectedSuperset = component.supersets[0];
    setSupersetIndex(0);
  } else {
    newSelectedSuperset = component.supersets[supersetIndex || 0];
  }

  if (!selectedExercise) {
    setSelectedExercise(newSelectedSuperset?.exercises[0] || null);
    setSetIndex(0);
  }

  setTrainingInProgress({
    ...useTraining.trainingInProgress,
    selectedComponent: component,
    supersets: component.supersets,
    startOfTraining: newTrainingInProgress.startOfTraining,
  } as TrainingInProgress);
}
