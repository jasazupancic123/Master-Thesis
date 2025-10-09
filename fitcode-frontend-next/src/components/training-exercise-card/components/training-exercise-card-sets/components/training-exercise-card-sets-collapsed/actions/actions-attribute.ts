import type { SetStateAction } from 'react';

import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { VolWorkSetType } from '@/controller/component/enum/param.enum';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { updateTraining } from '@/components/training-exercise-card/actions/actions-training';
import { TrainerDayViewProviderReturnTypeDefined } from '@/store/trainer-day-view.provider';
import { SupersetsProviderReturnType } from '@/store/supersets.provider';
import { MainProviderReturnType } from '@/store/main.provider';
import { GroupProviderReturnType } from '@/store/group.provider';

export function updateAttributeType(
  input: {
    exercise: TrainingExercise;
    param: Attribute;
    newValue: SetStateAction<string>;
    lOrR: string;
    min: number | undefined;
    max: number | undefined;
  },
  context: {
    useTrainerDayViewContext: TrainerDayViewProviderReturnTypeDefined;
  }
) {
  const { exercise, param, newValue, lOrR, min, max } = input;

  const { useTrainerDayViewContext } = context;

  const {
    component,
    selectedSubgroup,
    selectedExercises,
    supersets,
    setSupersets,
    setComponent,
  } = useTrainerDayViewContext;

  const exercisesToUpdate = selectedExercises.some(
    (ex) => ex.id === exercise.id
  )
    ? selectedExercises
    : [exercise];

  const supersetsCopy = [...supersets];

  // example: `int2` returns `int`
  const baseParamField = param.field.replace(/\d+/, '');

  for (const exerciseToUpdate of exercisesToUpdate) {
    const possibleParams = (
      lOrR === 'L'
        ? exerciseToUpdate.sets[0].paramValuesL
        : exerciseToUpdate.sets[0].paramValuesR || []
    ).filter((p) => p.field.startsWith(baseParamField));

    for (const possibleParam of possibleParams) {
      if (
        exerciseToUpdate.id === exercise.id &&
        possibleParam.field !== param.field
      )
        continue;

      const paramValuesLOrR = exercise.exercise?.isUnilateral
        ? exerciseToUpdate.exercise?.isUnilateral
          ? [
              exerciseToUpdate.sets[0].paramValuesL,
              exerciseToUpdate.sets[0].paramValuesR,
            ]
          : [exerciseToUpdate.sets[0].paramValuesL]
        : exerciseToUpdate.exercise?.isUnilateral
          ? [
              exerciseToUpdate.sets[0].paramValuesL,
              exerciseToUpdate.sets[0].paramValuesR,
            ]
          : [exerciseToUpdate.sets[0].paramValuesL];

      for (const [index, paramValues] of paramValuesLOrR.entries()) {
        if (!paramValues) continue;

        const lOrR = index === 0 ? 'L' : 'R';

        const paramIndex = paramValues.findIndex(
          (pv) => pv.field === possibleParam.field
        );

        if (paramIndex === -1) continue;

        const newExercise: TrainingExercise = {
          ...exerciseToUpdate,
        };

        const attribute = newExercise.params.find(
          (p) => p.field === possibleParam.field
        );

        if (
          !attribute ||
          !attribute.options?.some((o) => o.field === (newValue as string))
        )
          continue;

        const possibleParamsDefaultValue =
          exercise.exercise?.defaultParams?.filter((p) =>
            p.field.startsWith(baseParamField)
          );

        if (!possibleParamsDefaultValue) continue;

        for (const possibleParamDefaultValue of possibleParamsDefaultValue) {
          let defaultValue = possibleParamDefaultValue.options?.find(
            (o) => o.field === newValue
          )?.defaultValue;

          if (!defaultValue) continue;

          if (min !== undefined) {
            const num = Number(defaultValue);
            if (!isNaN(num) && num < min) defaultValue = min.toString();
          }
          if (max !== undefined) {
            const num = Number(defaultValue);
            if (!isNaN(num) && num > max) defaultValue = max.toString();
          }

          if (lOrR === 'L') {
            newExercise.sets.forEach((set) => {
              if (set.paramValuesL[paramIndex]) {
                set.paramValuesL[paramIndex].selected = newValue as string;
                set.paramValuesL[paramIndex].value = defaultValue;
              }
            });
          } else {
            newExercise.sets.forEach((set) => {
              if (set.paramValuesR?.[paramIndex]) {
                set.paramValuesR[paramIndex].selected = newValue as string;
                set.paramValuesR[paramIndex].value = defaultValue;
              }
            });
          }

          const existingIndex = supersetsCopy.findIndex((s) =>
            s.exercises.some((ex) => ex.id === exerciseToUpdate.id)
          );

          if (existingIndex === -1 || !supersetsCopy[existingIndex]) continue;

          supersetsCopy[existingIndex].exercises = supersetsCopy[
            existingIndex
          ].exercises.map((ex) =>
            ex.id === exerciseToUpdate.id ? newExercise : ex
          );
        }
      }
    }
  }

  // update for custom athlete workloads subgroups
  if (!selectedSubgroup?.parentId) {
    CustomWorkloadsSubgroupsService.updateExercisesAttributeTypes(
      component,
      selectedSubgroup,
      supersetsCopy,
      param
    );
  }

  const updatedComponent = selectedSubgroup
    ? {
        ...component,
        subgroups: component.subgroups.map((sg) =>
          sg.id === selectedSubgroup.id
            ? { ...sg, supersets: supersetsCopy }
            : sg
        ),
      }
    : { ...component, supersets: supersetsCopy };

  setSupersets(supersetsCopy);
  setComponent(updatedComponent);
}

export function updateSetNumbers(
  input: {
    newValue: SetStateAction<string>;
    correctExercise: TrainingExercise;
    correctSetsNumbers: {
      exerciseId: string;
      setsNumber: number;
    }[];
    correctSelectedExercises: TrainingExercise[];
    correctSelectedSubgroup: Subgroup | null;
    correctSupersets: Superset[];
  },
  context: {
    useMain: MainProviderReturnType;
    useGroup: GroupProviderReturnType;
    useTrainerDayView: TrainerDayViewProviderReturnTypeDefined;
    useSupersets: SupersetsProviderReturnType;
  }
) {
  const {
    correctExercise,
    newValue,
    correctSetsNumbers,
    correctSelectedExercises,
    correctSelectedSubgroup,
    correctSupersets,
  } = input;

  const { useMain, useGroup, useTrainerDayView, useSupersets } = context;

  const { exercises } = useMain;

  const { setDetectedChanges } = useGroup;

  const {
    component,
    training,
    setSupersets,
    setSelectedSubgroup,
    setTraining,
  } = useTrainerDayView;

  const { setSetsNumbers } = useSupersets;

  let updatedSetsNumbers;

  if (
    correctSelectedExercises.length &&
    correctSelectedExercises.some((e) => e.id === correctExercise.id)
  ) {
    updatedSetsNumbers = [...correctSetsNumbers];

    for (const selectedExercise of correctSelectedExercises) {
      const existingIndex = updatedSetsNumbers.findIndex(
        (sn) => sn.exerciseId === selectedExercise.id
      );

      const newSetNumber = {
        exerciseId: selectedExercise.id,
        setsNumber: +newValue,
      };

      if (existingIndex !== -1) {
        updatedSetsNumbers[existingIndex] = newSetNumber;
      } else {
        updatedSetsNumbers.push(newSetNumber);
      }
    }
  } else {
    const newSetNumber = {
      exerciseId: correctExercise.id,
      setsNumber: +newValue,
    };
    const existingIndex = correctSetsNumbers.findIndex(
      (sn) => sn.exerciseId === correctExercise.id
    );
    if (existingIndex !== -1) {
      const newSetsNumber = [...correctSetsNumbers];
      newSetsNumber[existingIndex] = newSetNumber;
      updatedSetsNumbers = newSetsNumber;
    } else {
      updatedSetsNumbers = [...correctSetsNumbers, newSetNumber];
    }
  }

  setSetsNumbers(updatedSetsNumbers);

  updateVolWorkSets({
    exercise: correctExercise,
    selectedExercises: correctSelectedExercises,
    setsNumbers: updatedSetsNumbers,
    exercises,
    selectedSubgroup: correctSelectedSubgroup,
    component,
    training,
    supersets: correctSupersets,
    setSupersets,
    setDetectedChanges,
    setSelectedSubgroup,
    setTraining,
  });
}

export function updateAttributeValue(
  input: {
    param: Attribute;
    newValue: SetStateAction<string>;
    lOrR: string;
    correctExercise: TrainingExercise;
    correctSelectedExercises: TrainingExercise[];
    correctSupersets: Superset[];
    correctSelectedSubgroup: Subgroup | null;
  },
  context: {
    useGroup: GroupProviderReturnType;
    useTrainerDayView: TrainerDayViewProviderReturnTypeDefined;
  }
) {
  const {
    param,
    newValue,
    lOrR,
    correctExercise,
    correctSelectedExercises,
    correctSupersets,
    correctSelectedSubgroup,
  } = input;

  const { useGroup, useTrainerDayView } = context;

  const { setDetectedChanges } = useGroup;

  const { training, component, setTraining, setSelectedSubgroup } =
    useTrainerDayView;

  const exercisesToUpdate = correctSelectedExercises.some(
    (ex) => ex.id === correctExercise.id
  )
    ? correctSelectedExercises
    : [correctExercise];

  const updatedExercises = [] as TrainingExercise[];

  /* 
    Variable Name: baseParamField

    Functionality: Get attribute name as everything but numbers

    Example: 'int2' returns 'int'
    
    Description: We need this, because some exercise can have 2 intensities 
    and lets say we update int2, and one exercise only has 1 intensity,
    so only int1 and it can happen that int1 is the same param type as 
    int2, so we need to check all int's in this example, because direct 
    matching by param.field will not work: "int1" !== "int2". 
    We later check in attributes.options if newValue is even possible, 
    so if new selected value is in options of an attribute, it works 
    and means that the int's are of the same type, if not, it skips
  */
  const baseParamField = param.field.replace(/\d+/, '');
  const baseParamDefaultValue = correctExercise.exercise?.defaultParams?.find(
    (p) => p.field === param.field
  )?.defaultValue;
  const baseSelected = correctExercise.sets[0].paramValuesL.find(
    (p) => p.field === param.field
  )?.selected;

  if (!baseParamDefaultValue || !baseSelected) return;

  updateSelectedExercisesCollapsedSets({
    updatedExercises,
    exercisesToUpdate,
    exercise: correctExercise,
    param,
    lOrR,
    baseParamField,
    baseParamDefaultValue,
    baseSelected,
    newValue,
  });

  // if it's not a custom workload subgroup, find all custom workload subgroups and update them
  // to the same value
  if (!correctSelectedSubgroup?.parentId) {
    CustomWorkloadsSubgroupsService.updateSelectedExercisesCollapsedSets(
      {
        component,
        exercise: correctExercise,
        selectedSubgroup: correctSelectedSubgroup,
        exercisesToUpdate,
        param,
      },
      {
        lOrR,
        baseParamField,
        baseParamDefaultValue,
        baseSelected,
        newValue,
      }
    );
  }

  updateTraining(
    {
      exercises: updatedExercises,
    },
    {
      training,
      component,
      setTraining,
      supersets: correctSupersets,
      setDetectedChanges,
      selectedSubgroup: correctSelectedSubgroup,
      setSelectedSubgroup,
    }
  );
}

export const updateSelectedExercisesCollapsedSets = (input: {
  updatedExercises?: TrainingExercise[];
  exercisesToUpdate: TrainingExercise[];
  exercise: TrainingExercise;
  param: Attribute;
  lOrR: string;
  baseParamField: string;
  baseParamDefaultValue: string;
  baseSelected: string;
  newValue: SetStateAction<string>;
}) => {
  const {
    updatedExercises,
    exercisesToUpdate,
    exercise,
    param,
    lOrR,
    baseParamField,
    baseParamDefaultValue,
    baseSelected,
    newValue,
  } = input;

  for (const exerciseToUpdate of exercisesToUpdate) {
    const possibleParams = (
      lOrR === 'L'
        ? exerciseToUpdate.sets[0].paramValuesL
        : exerciseToUpdate.sets[0].paramValuesR || []
    ).filter((p) => p.field.startsWith(baseParamField));

    for (const possibleParam of possibleParams) {
      if (
        exerciseToUpdate.id === exercise.id &&
        possibleParam.field !== param.field
      )
        continue;

      const paramDefaultValue = exerciseToUpdate.exercise?.defaultParams?.find(
        (p) => p.field === possibleParam.field
      )?.defaultValue;
      const paramSelected = exerciseToUpdate.sets[0].paramValuesL.find(
        (p) => p.field === possibleParam.field
      )?.selected;

      if (
        baseParamDefaultValue !== paramDefaultValue ||
        baseSelected !== paramSelected
      )
        continue;

      const paramIndex = (
        lOrR === 'L'
          ? exerciseToUpdate.sets[0].paramValuesL
          : exerciseToUpdate.sets[0].paramValuesR || []
      ).findIndex((pv) => pv.field === possibleParam.field);

      if (paramIndex === -1) continue;

      const updatedSets: ExerciseSet[] = exerciseToUpdate.sets.map((set) => {
        const updatedParamValuesL = [...set.paramValuesL].map(
          (param, index) =>
            ({
              field: param.field,
              selected: param.selected,
              value: index === paramIndex ? (newValue as string) : param.value,
            }) as AttributeValue
        );
        const updatedParamValuesR = set.paramValuesR
          ? [...set.paramValuesR].map(
              (param, index) =>
                ({
                  field: param.field,
                  selected: param.selected,
                  value:
                    index === paramIndex ? (newValue as string) : param.value,
                }) as AttributeValue
            )
          : undefined;
        return exercise.exercise?.isUnilateral
          ? exerciseToUpdate.exercise?.isUnilateral
            ? lOrR === 'L'
              ? {
                  setNumber: set.setNumber,
                  paramValuesL: updatedParamValuesL,
                  paramValuesR: set.paramValuesR,
                }
              : {
                  setNumber: set.setNumber,
                  paramValuesL: set.paramValuesL,
                  paramValuesR: updatedParamValuesR,
                }
            : {
                setNumber: set.setNumber,
                paramValuesL: updatedParamValuesL,
                paramValuesR: set.paramValuesR,
              }
          : exerciseToUpdate.exercise?.isUnilateral
            ? {
                setNumber: set.setNumber,
                paramValuesL: updatedParamValuesL,
                paramValuesR: updatedParamValuesR,
              }
            : {
                setNumber: set.setNumber,
                paramValuesL: updatedParamValuesL,
                paramValuesR: set.paramValuesR,
              };
      });

      exerciseToUpdate.sets = [...updatedSets];
      if (updatedExercises) updatedExercises.push(exerciseToUpdate);
    }
  }
};

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

function updateVolWorkSets(input: {
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
