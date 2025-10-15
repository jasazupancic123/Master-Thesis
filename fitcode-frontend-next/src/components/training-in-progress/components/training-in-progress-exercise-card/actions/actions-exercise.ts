import { updateExerciseAttributeValues } from '@/components/training-exercise-card/components/training-exercise-card-sets/components/training-exercise-card-sets-expanded/actions/actions-attribute-values';
import type { ParamType } from '@/controller/component/enum/param.enum';
import { IntType, VolType } from '@/controller/component/enum/param.enum';
import type { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';
import type { TrainingProviderReturnTypeDefined } from '@/store/training.provider';
import type { TrainingInProgressProviderReturnType } from '@/store/training-in-progress.provider';

export const updateExerciseValues = (
  input: {
    repsCountL: number;
    repsCountR?: number;
    tempoL: string | null;
    tempoR?: string | null;
    passedExercise?: TrainingExerciseRecording;
    updateSelectedExercise?: boolean;
  },
  context: {
    useTraining: TrainingProviderReturnTypeDefined;
    useTrainingInProgress: TrainingInProgressProviderReturnType;
  }
) => {
  const {
    repsCountL,
    repsCountR,
    tempoL,
    tempoR,
    passedExercise,
    updateSelectedExercise,
  } = input;

  const { useTraining, useTrainingInProgress } = context;

  const { trainingInProgress, updateTrainingInProgress } = useTraining;

  const { selectedExercise, setSelectedExercise, supersetIndex, setIndex } =
    useTrainingInProgress;

  if (supersetIndex === undefined) return;

  if (setIndex === undefined) return;

  const updatableExercise = passedExercise || selectedExercise;

  if (!updatableExercise) return;

  const selectedSet = updatableExercise.sets[setIndex];

  if (!selectedSet) return;

  let repParamField: ParamType | undefined;
  let tempoParamField: ParamType | undefined;

  const paramValues = [
    selectedSet.paramValuesL,
    selectedSet.paramValuesR,
  ].filter((p) => p !== undefined);

  let i = -1;
  for (const paramValue of paramValues) {
    i++;

    const repParamFieldSet = paramValue.find((p) => p.selected === VolType.Rep);

    if (repParamFieldSet) repParamField = repParamFieldSet.field as ParamType;

    const tempoParamFieldSet = paramValue.find(
      (p) => p.selected === IntType.Tempo
    );

    if (tempoParamFieldSet)
      tempoParamField = tempoParamFieldSet.field as ParamType;

    const repParam = updatableExercise.params.find(
      (p) => p.field === repParamField
    );

    const tempoParam = updatableExercise.params.find(
      (p) => p.field === tempoParamField
    );

    if (repParam) {
      if (i === 0 || (i === 1 && repsCountR !== undefined)) {
        updateExerciseAttributeValues(
          {
            newValue:
              i === 0 ? repsCountL.toString() : repsCountR?.toString() || '',
            i: setIndex,
            set: selectedSet,
            lOrR: i === 0 ? 'L' : 'R',
            correctSelectedExercises: [updatableExercise],
            correctExercise: updatableExercise,
            correctParam: repParam,
            correctSupersets: trainingInProgress.supersets,
            correctSelectedSubgroup: null,
          },
          {
            training: trainingInProgress.training,
            component: trainingInProgress.selectedComponent,
            setTraining: () => {},
            setDetectedChanges: () => {},
            setSelectedSubgroup: () => {},
          }
        );
      }
    }

    if (tempoParam) {
      if (
        (i === 0 && tempoL !== undefined && tempoL !== null) ||
        (i === 1 && tempoR !== undefined && tempoR !== null)
      ) {
        updateExerciseAttributeValues(
          {
            newValue:
              i === 0 && tempoL ? tempoL.toString() : tempoR?.toString() || '',
            i: setIndex,
            set: selectedSet,
            lOrR: i === 0 ? 'L' : 'R',
            correctSelectedExercises: [updatableExercise],
            correctExercise: updatableExercise,
            correctParam: tempoParam,
            correctSupersets: trainingInProgress.supersets,
            correctSelectedSubgroup: null,
          },
          {
            training: trainingInProgress.training,
            component: trainingInProgress.selectedComponent,
            setTraining: () => {},
            setDetectedChanges: () => {},
            setSelectedSubgroup: () => {},
          }
        );
      }
    }
  }

  if (updateSelectedExercise) setSelectedExercise(updatableExercise);

  updateTrainingInProgress(updatableExercise, supersetIndex);
};

export const goToNextExercise = (context: {
  useTrainingInProgress: TrainingInProgressProviderReturnType;
}) => {
  const { useTrainingInProgress } = context;

  const {
    selectedSuperset,
    selectedExercise,
    setSelectedExercise,
    setSetIndex,
  } = useTrainingInProgress;

  if (!selectedSuperset || !selectedExercise) return;

  const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
  const nextExercise = selectedSuperset.exercises[currentIndex + 1];
  if (nextExercise) {
    setSelectedExercise(nextExercise);
    setSetIndex(0);
  }
};

export const goToPreviousExercise = (context: {
  useTrainingInProgress: TrainingInProgressProviderReturnType;
}) => {
  const { useTrainingInProgress } = context;

  const {
    selectedSuperset,
    selectedExercise,
    setSelectedExercise,
    setSetIndex,
  } = useTrainingInProgress;

  if (!selectedSuperset || !selectedExercise) return;

  const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
  const previousExercise = selectedSuperset.exercises[currentIndex - 1];
  if (previousExercise) {
    setSelectedExercise(previousExercise);
    setSetIndex(0);
  }
};
