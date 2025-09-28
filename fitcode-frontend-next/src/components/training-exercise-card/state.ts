import ReactDOM from 'react-dom';

import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';

export function updateVolWorkSets(input: {
  exercise: TrainingExercise;
  exercises: Exercise[];
  selectedExercises: TrainingExercise[];
  setsNumbers: { exerciseId: string; setsNumber: number }[];
  selectedSubgroup: Subgroup | null;
  component: TrainingComponent;
  training: Training;
  supersets: Superset[];
  setSupersets: SetState<Superset[]>;
  setDetectedChanges: SetState<boolean>;
  setSelectedSubgroup: SetState<Subgroup | null>;
  setTraining: SetStateNullable<Training>;
}) {
  const {
    training,
    setTraining,
    component,
    exercise,
    exercises,
    selectedExercises,
    setsNumbers,
    selectedSubgroup,
    setSelectedSubgroup,
    supersets,
    setSupersets,
    setDetectedChanges,
  } = input;

  const foundExercise = exercises.find((e) => e.id === exercise.id);
  if (!foundExercise) return;

  if (
    selectedExercises.length &&
    selectedExercises.some((e) => e.id === exercise.id)
  ) {
    // update multiple selected exercises
    const updatedExercises = [] as TrainingExercise[];

    updateSelectedExercisesVolWorkSets({
      updatedExercises,
      selectedExercises,
      setsNumbers,
      exercises,
    });

    // if it's not a custom workload subgroup, find all custom workload subgroups and update
    // number of sets to the same value
    if (!selectedSubgroup?.parentId) {
      CustomWorkloadsSubgroupsService.updateSelectedExercisesVolWorkSets(
        component,
        selectedSubgroup,
        selectedExercises,
        setsNumbers,
        exercises
      );
    }

    updateTraining(
      { exercises: updatedExercises },
      {
        training,
        component,
        supersets,
        setDetectedChanges,
        selectedSubgroup,
        setSelectedSubgroup,
        setTraining,
      }
    );
  } else {
    // update single exercise
    const updatedExercises = [] as TrainingExercise[]; // will contain only 1

    updateSingleExerciseVolWorkSets({
      updatedExercises,
      exercise,
      setsNumbers,
      foundExercise,
    });

    // if it's not a custom workload subgroup, find all custom workload subgroups and update
    // number of sets to the same value
    if (!selectedSubgroup?.parentId) {
      CustomWorkloadsSubgroupsService.updateSingleExerciseVolWorkSets(
        component,
        selectedSubgroup,
        exercise,
        setsNumbers,
        foundExercise
      );
    }

    updateTraining(
      { exercises: updatedExercises },
      {
        training,
        component,
        setTraining,
        supersets,
        setDetectedChanges,
        selectedSubgroup,
        setSelectedSubgroup,
        setSupersets,
      }
    );
  }
}

export function updateSelectedExercisesVolWorkSets(input: {
  updatedExercises?: TrainingExercise[];
  selectedExercises: TrainingExercise[];
  setsNumbers: {
    exerciseId: string;
    setsNumber: number;
  }[];
  exercises: Exercise[];
}) {
  const { updatedExercises, selectedExercises, setsNumbers, exercises } = input;

  for (const selectedExercise of selectedExercises) {
    const foundExercise = exercises.find((e) => e.id === selectedExercise.id);
    if (!foundExercise) continue;

    const newSets = setsNumbers.find(
      (s) => s.exerciseId === selectedExercise.id
    )?.setsNumber;

    if (newSets === undefined || newSets === null) return;

    if (newSets > 16 || newSets < 1) return;

    const prevSets = selectedExercise.sets.length;

    if (prevSets > newSets) {
      // remove sets
      selectedExercise.sets = [...selectedExercise.sets].slice(0, newSets);
    } else {
      // add sets to the end
      const paramValues = selectedExercise.sets[
        selectedExercise.sets.length - 1
      ].paramValuesL.map((pv) => ({ ...pv }));

      selectedExercise.sets = [
        ...selectedExercise.sets,
        ...Array.from({ length: newSets - prevSets }, (_, i) => ({
          setNumber: prevSets + i + 1,
          paramValuesL: paramValues,
          ...(foundExercise.isUnilateral && { paramValuesR: paramValues }),
        })),
      ];
    }

    if (updatedExercises) updatedExercises.push(selectedExercise);
  }
}

export function updateSingleExerciseVolWorkSets(input: {
  updatedExercises?: TrainingExercise[];
  exercise: TrainingExercise;
  setsNumbers: {
    exerciseId: string;
    setsNumber: number;
  }[];
  foundExercise: Exercise;
}) {
  const { updatedExercises, exercise, setsNumbers, foundExercise } = input;

  const newSets = setsNumbers.find(
    (s) => s.exerciseId === exercise.id
  )?.setsNumber;

  if (newSets === undefined || newSets === null) return;

  if (newSets > 16 || newSets < 1) return;

  const prevSets = exercise.sets.length;

  if (prevSets > newSets) {
    // remove sets
    exercise.sets = [...exercise.sets].slice(0, newSets);
  } else {
    // add sets to the end
    const paramValues = exercise.sets[
      exercise.sets.length - 1
    ].paramValuesL.map((pv) => ({ ...pv }));

    exercise.sets = [
      ...exercise.sets,
      ...Array.from({ length: newSets - prevSets }, (_, i) => ({
        setNumber: prevSets + i + 1,
        paramValuesL: paramValues,
        ...(foundExercise.isUnilateral && { paramValuesR: paramValues }),
      })),
    ];
  }

  if (updatedExercises) updatedExercises.push(exercise);
}

export function updateTraining(
  input: {
    exercises: TrainingExercise[];
  },
  state: {
    training: Training;
    component: TrainingComponent | null;
    supersets: Superset[];
    setDetectedChanges: SetState<boolean>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setTraining: SetStateNullable<Training>;
    setSupersets?: SetState<Superset[]>;
  }
) {
  const { exercises } = input;

  const {
    training,
    component,
    supersets,
    setDetectedChanges,
    selectedSubgroup,
    setSelectedSubgroup,
    setTraining,
    setSupersets,
  } = state;

  if (!training || !component) return;

  const newSupersets = [...supersets];
  let updatedSubgroup = selectedSubgroup ? { ...selectedSubgroup } : undefined;
  let updatedComponent = { ...component };
  let detectedChanges = false;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    const supersetIndex = supersets.findIndex((s) =>
      s.exercises.some((e) => e.id === exercise.id)
    );
    if (supersetIndex === -1) continue;

    const newSuperset = { ...newSupersets[supersetIndex] };
    const exerciseIndex = newSuperset.exercises.findIndex(
      (e) => e.id === exercise.id
    );
    if (exerciseIndex === -1 || !training || !component) continue;

    newSuperset.exercises[exerciseIndex] = { ...exercise };
    newSupersets[supersetIndex] = newSuperset;
    detectedChanges = true;
  }

  if (!detectedChanges) return;

  ReactDOM.unstable_batchedUpdates(() => {
    setDetectedChanges(true);

    if (selectedSubgroup) {
      updatedSubgroup = {
        ...updatedSubgroup!,
        supersets: newSupersets,
      };

      updatedComponent = {
        ...updatedComponent,
        subgroups: updatedComponent.subgroups.map((s) =>
          s.id === updatedSubgroup?.id ? updatedSubgroup! : s
        ),
      };

      const updatedComponents = training.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      );

      const newTraining = { ...training, components: updatedComponents };

      if (setSupersets) {
        setSupersets(newSupersets);
      }

      setSelectedSubgroup(updatedSubgroup!);

      setTraining(newTraining);
    } else {
      updatedComponent = {
        ...updatedComponent,
        supersets: newSupersets,
      };

      const updatedComponents = training.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      );

      const newTraining = {
        ...training,
        components: updatedComponents,
      };

      if (setSupersets) {
        setSupersets(newSupersets);
      }

      setTraining(newTraining);
    }
  });
}

export const getPerscribedFieldName = (
  param: Attribute,
  leftOrRight: 'L' | 'R'
): keyof Workload => {
  let perscribedFieldName;
  switch (param.field) {
    case 'int1':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedIntWork1ValueL'
          : 'prescribedIntWork1ValueR';
      break;
    case 'int2':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedIntWork2ValueL'
          : 'prescribedIntWork2ValueR';
      break;
    case 'vol1':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedVolWork1ValueL'
          : 'prescribedVolWork1ValueR';
      break;
    case 'vol2':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedVolWork2ValueL'
          : 'prescribedVolWork2ValueR';
      break;
    case 'intRec':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedIntRecValueL'
          : 'prescribedIntRecValueR';
      break;
    case 'volRec':
      perscribedFieldName =
        leftOrRight === 'L'
          ? 'prescribedVolRecValueL'
          : 'prescribedVolRecValueR';
      break;
    default:
      break;
  }

  return perscribedFieldName as keyof Workload;
};

export const getLAndRValues = (
  input: {
    set: ExerciseSet;
    param: Attribute;
    setIndex: number;
    paramIndex: number;
  },
  state: {
    training: Training;
    exercise: TrainingExercise;
    selectedAthleteWorkloads: Workload[];
    selectedAthlete?: AuthUser;
  }
): {
  valueL: AttributeValue | null;
  valueR: AttributeValue | null;
} => {
  const { param, setIndex } = input;
  const { exercise } = state;

  const valueL: AttributeValue | null = exercise.sets[
    setIndex
  ].paramValuesL.find((pv) => pv.field === param.field) || {
    field: param.field,
    selected: 'set',
    value: exercise.sets.length.toString(),
  };
  const valueR: AttributeValue | null = exercise.sets[
    setIndex
  ].paramValuesR?.find((pv) => pv.field === param.field) || {
    field: param.field,
    selected: 'set',
    value: exercise.sets.length.toString(),
  };

  return { valueL, valueR };
};
