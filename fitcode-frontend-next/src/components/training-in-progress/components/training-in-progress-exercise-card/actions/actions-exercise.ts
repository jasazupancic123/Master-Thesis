import { updateExerciseAttributeValues } from '@/components/training-exercise-card/components/training-exercise-card-sets/components/training-exercise-card-sets-expanded/actions/actions-attribute-values';
import type { ParamType } from '@/controller/component/enum/param.enum';
import { IntType, VolType } from '@/controller/component/enum/param.enum';
import type { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';
import type { TrainingProviderReturnTypeDefined } from '@/store/training.provider';
import type { TrainingInProgressProviderReturnType } from '@/store/training-in-progress.provider';

export const updateExerciseValues = (
  input: {
    repsCount: number;
    tempo: string;
    passedExercise?: TrainingExerciseRecording;
    updateSelectedExercise?: boolean;
  },
  context: {
    useTraining: TrainingProviderReturnTypeDefined;
    useTrainingInProgress: TrainingInProgressProviderReturnType;
  }
) => {
  const { repsCount, tempo, passedExercise, updateSelectedExercise } = input;

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

  const repParamFieldSet = selectedSet.paramValuesL.find(
    (p) => p.selected === VolType.Rep
  );
  if (repParamFieldSet) repParamField = repParamFieldSet.field as ParamType;

  const tempoParamFieldSet = selectedSet.paramValuesL.find(
    (p) => p.selected === IntType.Tempo
  );
  if (tempoParamFieldSet)
    tempoParamField = tempoParamFieldSet.field as ParamType;

  const repParam = updatableExercise.params.find(
    (p) => p.field === repParamField
  );

  if (repParam) {
    ['L'].concat(selectedSet.paramValuesR ? ['R'] : []).forEach((lOrR) => {
      updateExerciseAttributeValues(
        {
          newValue: repsCount.toString(),
          i: setIndex,
          set: selectedSet,
          lOrR: lOrR as 'L' | 'R',
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
    });
  }

  const tempoParam = updatableExercise.params.find(
    (p) => p.field === tempoParamField
  );

  if (tempoParam) {
    ['L'].concat(selectedSet.paramValuesR ? ['R'] : []).forEach((lOrR) => {
      updateExerciseAttributeValues(
        {
          newValue: tempo.toString(),
          i: setIndex,
          set: selectedSet,
          lOrR: lOrR as 'L' | 'R',
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
    });
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
