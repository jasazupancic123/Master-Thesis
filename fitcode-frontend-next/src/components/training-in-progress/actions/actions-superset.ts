import type { ITrainingInProgressUtilsCtx } from '../context/training-in.progress-utils.provider';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { IMainContext } from '@/store/main.provider';
import type { ITrainingInProgressContext } from '@/store/training-in-progress.provider';
import type { ITrainingsContextDefined } from '@/store/trainings.provider';

export function handleChangeSuperset(
  input: { superset: Superset; i: number },
  context: {
    useMain: IMainContext;
    useTraining: ITrainingsContextDefined;
    useTrainingInProgress: ITrainingInProgressContext;
  }
) {
  const { superset, i } = input;

  const { useTrainingInProgress } = context;

  const { setSelectedExercise, setSetIndex, setSupersetIndex, supersetIndex } =
    useTrainingInProgress;

  if (supersetIndex === undefined) return;

  setSupersetIndex(i);
  setSelectedExercise(superset.exercises[0] || null);
  setSetIndex(0);
}

export const handleFinishSuperset = async (context: {
  useMain: IMainContext;
  useTraining: ITrainingsContextDefined;
  useTrainingInProgress: ITrainingInProgressContext;
  useTrainingInProgressUtils: ITrainingInProgressUtilsCtx;
}) => {
  const { useTraining, useTrainingInProgress, useTrainingInProgressUtils } =
    context;

  const { trainingInProgress } = useTraining;
  const { supersetIndex, workloads } = useTrainingInProgress;

  if (!trainingInProgress) return;

  // const { supersetIndex } = useTrainingInProgress;

  const { handleCloseMenu, handleCompleteTraining } =
    useTrainingInProgressUtils;

  // const { setUndoneExercises } = useUndoneExercises;

  const component = trainingInProgress.training.components.find(
    (comp) => comp.id === trainingInProgress.componentId
  );

  if (!component) return;

  if (!component.supersets || supersetIndex === undefined) return;

  handleCloseMenu();

  const undoneExercises: TrainingExercise[] = [];

  component.supersets.forEach((superset) => {
    const undoneExercisesForSuperset =
      ExerciseSetService.getUndoneExercisesFromSuperset(
        superset,
        {
          trainingId: trainingInProgress.training.id,
          supersetIndex,
          componentId: trainingInProgress.componentId,
        },
        workloads
      );

    undoneExercisesForSuperset.forEach((exercise) => {
      if (!undoneExercises.find((e) => e.id === exercise.id))
        undoneExercises.push(exercise);
    });
  });

  // const extendedUndoneExercises: TrainingExerciseExtended[] =
  //   undoneExercises.map((exercise) => ({
  //     ...exercise,
  //     componentId: trainingInProgress.selectedComponent.id,
  //     supersetIndex: supersetIndex || 0,
  //   }));

  // if (undoneExercises.length > 0) {
  //   setUndoneExercises(extendedUndoneExercises);
  //   setShowUndoneSetsError(true);
  //   return;
  // }

  await handleCompleteTraining();
};

export const handleAdvanceInSuperset = (
  context: {
    useMain: IMainContext;
    useTraining: ITrainingsContextDefined;
    useTrainingInProgress: ITrainingInProgressContext;
    useTrainingInProgressUtils: ITrainingInProgressUtilsCtx;
  },
  skipCurrentWorkload?: boolean
) => {
  const { useTraining, useTrainingInProgress, useTrainingInProgressUtils } =
    context;

  const { trainingInProgress, setTrainingInProgress } = useTraining;

  const {
    setSelectedExercise,
    setSetIndex,
    supersetIndex,
    setSupersetIndex,
    selectedExercise: exercise,
    setIndex,
    workloads,
  } = useTrainingInProgress;

  const { handleFinish } = useTrainingInProgressUtils;

  if (!trainingInProgress || !exercise) return;

  if (supersetIndex === undefined) return;

  const component = trainingInProgress.training.components.find(
    (comp) => comp.id === trainingInProgress.componentId
  );

  if (!component) return;

  const currentSuperset = component.supersets[supersetIndex];

  if (!currentSuperset) return;

  const exercisesInCurrentSuperset = currentSuperset.exercises;

  // Check if every set in the current superset is completed
  const allSetsCompleted = exercisesInCurrentSuperset.every((ex) => {
    return ex.sets.every((set) => {
      if (
        skipCurrentWorkload &&
        ex.id === exercise.id &&
        set.setNumber - 1 === setIndex
      )
        return true;

      const isSetCompleted = ExerciseSetService.isSetCompleted(
        {
          trainingId: trainingInProgress.training.id,
          componentId: trainingInProgress.componentId,
          exerciseId: ex.id,
          supersetIndex,
          setIndex: set.setNumber - 1,
        },
        workloads
      );

      return isSetCompleted;
    });
  });

  if (allSetsCompleted) {
    // Move to next superset

    const isLastSuperset = supersetIndex === component.supersets.length - 1;

    if (isLastSuperset) {
      handleFinish();
      return;
    }

    const nextSuperset = component.supersets[supersetIndex + 1];

    if (!nextSuperset) return;

    setTrainingInProgress((prev) => ({
      ...prev!,
      supersetIndex: supersetIndex + 1,
    }));
    setSelectedExercise(nextSuperset.exercises[0]);
    setSetIndex(0);
    setSupersetIndex(supersetIndex + 1);

    return;
  }

  const currentExerciseIndex = exercisesInCurrentSuperset.findIndex(
    (ex) => ex.id === exercise.id
  );

  if (currentExerciseIndex === -1) return;

  let j = 0;

  for (
    let i = currentExerciseIndex + 1;
    j < exercisesInCurrentSuperset.length;
    i++
  ) {
    j++;

    if (i >= exercisesInCurrentSuperset.length)
      i -= exercisesInCurrentSuperset.length;

    const currentExercise = exercisesInCurrentSuperset[i];

    if (!currentExercise) continue;

    const hasCompletedAllSets = !ExerciseSetService.hasExerciseGotUndoneSets(
      currentExercise,
      {
        trainingId: trainingInProgress.training.id,
        supersetIndex,
        componentId: trainingInProgress.componentId,
      },
      workloads
    );

    if (hasCompletedAllSets) continue;

    let hasAdvanced = false;

    currentExercise.sets.forEach((set) => {
      if (hasAdvanced) return;

      const completed = ExerciseSetService.isSetCompleted(
        {
          trainingId: trainingInProgress.training.id,
          componentId: trainingInProgress.componentId,
          exerciseId: currentExercise.id,
          supersetIndex,
          setIndex: set.setNumber - 1,
        },
        workloads
      );

      if (!completed) {
        hasAdvanced = true;

        setSelectedExercise(currentExercise);
        setSetIndex(set.setNumber - 1);
      }
    });

    if (hasAdvanced) return;
  }
};
