import type { SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import { updateTraining } from '../training-exercise-card/state';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { VolWorkSetType } from '@/controller/component/enum/param.enum';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import { TrainingService } from '@/controller/training/training.service';
import type { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { IntensityVolumeValues } from '@/controller/training/type/intensity-volume-values.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { PrescribedWorkload } from '@/controller/training/type/workload-value.type';
import type { User } from '@/controller/user/type/user.type';

function setWorkload<K extends keyof PrescribedWorkload>(
  w: PrescribedWorkload,
  key: K,
  value: PrescribedWorkload[K]
) {
  w[key] = value;
}

export function updateAttributeType(
  input: {
    exercise: TrainingExercise;
    param: Attribute;
    newValue: SetStateAction<string>;
    lOrR: string;
  },
  state: {
    selectedExercises: TrainingExercise[];
    supersets: Superset[];
    setSupersets: SetState<Superset[]>;
    selectedAthlete: User | undefined;
    customAthleteWorkloads: Workload[];
    setCustomAthleteWorkloads: (value: SetStateAction<Workload[]>) => void;
  }
) {
  const { exercise, param, newValue, lOrR } = input;
  const {
    selectedExercises,
    supersets,
    setSupersets,
    selectedAthlete,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
  } = state;

  const exercisesToUpdate = selectedExercises.some(
    (ex) => ex.id === exercise.id
  )
    ? selectedExercises
    : [exercise];

  const supersetsCopy = [...supersets];

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

  const copyAthleteWorkloads = [...customAthleteWorkloads];

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

      const paramValuesLOrR = exercise.exercise?.isBilateral
        ? exerciseToUpdate.exercise?.isBilateral
          ? [
              exerciseToUpdate.sets[0].paramValuesL,
              exerciseToUpdate.sets[0].paramValuesR,
            ]
          : [exerciseToUpdate.sets[0].paramValuesL]
        : exerciseToUpdate.exercise?.isBilateral
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

        const defaultValue = exercise.exercise?.defaultParams
          ?.find((p) => p.field === possibleParam.field)
          ?.options?.find((o) => o.field === newValue)?.defaultValue;

        if (!defaultValue) continue;

        if (lOrR === 'L') {
          newExercise.sets.forEach((set) => {
            if (set.paramValuesL[paramIndex]) {
              set.paramValuesL[paramIndex].selected = newValue as string;
              set.paramValuesL[paramIndex].value = defaultValue;
            }

            if (selectedAthlete) {
              const workload = copyAthleteWorkloads.find(
                (w) =>
                  w.userId === selectedAthlete.uid &&
                  w.exerciseId === exerciseToUpdate.id &&
                  w.setNumber === set.setNumber
              );

              if (workload) {
                const fieldName = TrainingService.getPerscribedFieldName(
                  possibleParam,
                  lOrR
                );

                const parsed =
                  defaultValue === '' ? undefined : Number(defaultValue);
                const value = Number.isNaN(parsed) ? undefined : parsed;

                setWorkload(workload, fieldName, value);
              }
            }
          });
        } else {
          newExercise.sets.forEach((set) => {
            if (set.paramValuesR?.[paramIndex]) {
              set.paramValuesR[paramIndex].selected = newValue as string;
              set.paramValuesR[paramIndex].value = defaultValue;
            }

            if (selectedAthlete) {
              const workload = copyAthleteWorkloads.find(
                (w) =>
                  w.userId === selectedAthlete.uid &&
                  w.exerciseId === exerciseToUpdate.id &&
                  w.setNumber === set.setNumber
              );

              if (workload) {
                const fieldName = TrainingService.getPerscribedFieldName(
                  possibleParam,
                  lOrR
                );

                const parsed =
                  defaultValue === '' ? undefined : Number(defaultValue);
                const value = Number.isNaN(parsed) ? undefined : parsed;

                setWorkload(workload, fieldName, value);
              }
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

  setSupersets(supersetsCopy);
  setCustomAthleteWorkloads(copyAthleteWorkloads);
}

export function updateVolWorkSets(
  input: {
    exercise: TrainingExercise;
    newValue: SetStateAction<string>;
  },
  state: {
    setsNumbers: {
      exerciseId: string;
      setsNumber: number;
    }[];
    selectedExercises: TrainingExercise[];
    setSetsNumbers: (
      value: SetStateAction<
        {
          exerciseId: string;
          setsNumber: number;
        }[]
      >
    ) => void;
  }
) {
  const { exercise, newValue } = input;
  const { setsNumbers, selectedExercises, setSetsNumbers } = state;

  if (
    selectedExercises.length &&
    selectedExercises.some((e) => e.id === exercise.id)
  ) {
    const updatedSetsNumbers = [...setsNumbers];

    for (const selectedExercise of selectedExercises) {
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

    setSetsNumbers(updatedSetsNumbers);
  } else {
    const newSetNumber = {
      exerciseId: exercise.id,
      setsNumber: +newValue,
    };
    setSetsNumbers((prev) => {
      const existingIndex = prev.findIndex(
        (sn) => sn.exerciseId === exercise.id
      );
      if (existingIndex !== -1) {
        const newSetsNumber = [...prev];
        newSetsNumber[existingIndex] = newSetNumber;
        return newSetsNumber;
      }
      return [...prev, newSetNumber];
    });
  }
}

export function updateAttributeValue(
  input: {
    exercise: TrainingExercise;
    param: Attribute;
    newValue: SetStateAction<string>;
    lOrR: string;
  },
  state: {
    selectedExercises: TrainingExercise[];
    training: Training;
    component: TrainingComponent;
    setTraining: SetStateNullable<Training>;
    supersets: Superset[];
    setDetectedChanges: SetState<boolean>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
  }
) {
  const { exercise, param, newValue, lOrR } = input;
  const {
    selectedExercises,
    training,
    component,
    setTraining,
    supersets,
    setDetectedChanges,
    selectedSubgroup,
    setSelectedSubgroup,
  } = state;

  const exercisesToUpdate = selectedExercises.some(
    (ex) => ex.id === exercise.id
  )
    ? selectedExercises
    : [exercise];

  const updatedExercises = [] as TrainingExercise[];
  const intensityVolumeValues = [] as IntensityVolumeValues[];

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
  const baseParamDefaultValue = exercise.exercise?.defaultParams?.find(
    (p) => p.field === param.field
  )?.defaultValue;
  const baseSelected = exercise.sets[0].paramValuesL.find(
    (p) => p.field === param.field
  )?.selected;

  if (!baseParamDefaultValue || !baseSelected) return;

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
        return exercise.exercise?.isBilateral
          ? exerciseToUpdate.exercise?.isBilateral
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
          : exerciseToUpdate.exercise?.isBilateral
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

      const intensityVolumeValue =
        TrainingService.getAverageIntVol(updatedSets);

      exerciseToUpdate.sets = [...updatedSets];
      updatedExercises.push(exerciseToUpdate);
      intensityVolumeValues.push(intensityVolumeValue);
    }

    updateTraining(
      {
        exercises: updatedExercises,
        intensityVolumeValues: intensityVolumeValues,
      },
      {
        training,
        component,
        setTraining,
        supersets,
        setDetectedChanges,
        selectedSubgroup,
        setSelectedSubgroup,
      }
    );
  }
}

export function updateCollapsedSelectedAthleteValues(
  input: {
    exercise: TrainingExercise;
    param: Attribute;
    newValue: SetStateAction<string>;
    lOrR: string;
  },
  state: {
    training: Training;
    component: TrainingComponent;
    selectedExercises: TrainingExercise[];
    supersets: Superset[];
    selectedAthleteWorkloads: CompletedFutureWorkloads;
    setCustomAthleteWorkloads: (value: SetStateAction<Workload[]>) => void;
    selectedAthlete: User;
  }
) {
  const { exercise, param, newValue, lOrR } = input;
  const {
    training,
    component,
    selectedExercises,
    supersets,
    selectedAthleteWorkloads,
    setCustomAthleteWorkloads,
    selectedAthlete,
  } = state;

  const exercisesToUpdate = selectedExercises.some(
    (ex) => ex.id === exercise.id
  )
    ? selectedExercises
    : [exercise];

  const baseParamField = param.field.replace(/\d+/, '');
  const baseParamDefaultValue = exercise.exercise?.defaultParams?.find(
    (p) => p.field === param.field
  )?.defaultValue;
  const baseSelected = exercise.sets[0].paramValuesL.find(
    (p) => p.field === param.field
  )?.selected;

  if (!baseParamDefaultValue || !baseSelected) return;

  for (const exerciseToUpdate of exercisesToUpdate) {
    const exerciseSupersetIndex = supersets.findIndex((s) =>
      s.exercises.some((ex) => ex.id === exerciseToUpdate.id)
    );

    if (exerciseSupersetIndex === -1) {
      toast.error(
        `Superset for exercise ${exerciseToUpdate.exercise?.name || 'Unknown Exercise'} not found`
      );
      return;
    }

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

      for (const set of exerciseToUpdate.sets) {
        const existingWorkload = selectedAthleteWorkloads.futureWorkloads.find(
          (w) =>
            w.componentId === component.id &&
            w.exerciseId === exerciseToUpdate.id &&
            w.setNumber === set.setNumber &&
            w.userId === selectedAthlete.uid
        );

        const newCustomWorkload =
          existingWorkload ||
          TrainingService.getPrescribedWorkload(
            exerciseToUpdate,
            set,
            !exercise.exercise?.isBilateral &&
              exerciseToUpdate.exercise?.isBilateral
          );

        const fieldNames =
          !exercise.exercise?.isBilateral &&
          exerciseToUpdate.exercise?.isBilateral
            ? [
                TrainingService.getPerscribedFieldName(possibleParam, 'L'),
                TrainingService.getPerscribedFieldName(possibleParam, 'R'),
              ]
            : [
                TrainingService.getPerscribedFieldName(
                  possibleParam,
                  lOrR as 'L' | 'R'
                ),
              ];

        // edit the field that was changed
        for (const fieldName of fieldNames)
          newCustomWorkload[fieldName] = +newValue as unknown as undefined;

        // add the new workload to the custom athlete workloads
        setCustomAthleteWorkloads((prev) => {
          const existingIndex = prev.findIndex(
            (w) =>
              w.componentId === component.id &&
              w.exerciseId === exerciseToUpdate.id &&
              w.setNumber === set.setNumber &&
              w.userId === selectedAthlete.uid
          );

          if (existingIndex !== -1) {
            const newWorkloads = [...prev];

            const parsed = newValue === '' ? undefined : Number(newValue);
            const value: number | undefined =
              parsed === undefined || Number.isNaN(parsed) ? undefined : parsed;

            const patch = Object.fromEntries(
              fieldNames.map((k) => [k, value])
            ) as Partial<Pick<PrescribedWorkload, (typeof fieldNames)[number]>>;

            newWorkloads[existingIndex] = {
              ...newWorkloads[existingIndex],
              supersetIndex: exerciseSupersetIndex,
              ...patch,
            };

            return newWorkloads;
          }

          // if not found, add a new workload
          return [
            ...prev,
            {
              ...newCustomWorkload,
              id: v4(),
              componentId: component.id,
              exerciseId: exerciseToUpdate.id,
              supersetIndex: exerciseSupersetIndex,
              setNumber: set.setNumber,
              userId: selectedAthlete.uid,
              institutionId: undefined,
              groupId: undefined,
              cycleId: undefined,
              trainingId: training.id,
              status: SetStatus.NOT_STARTED,
              notes: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              plannedAt: component.from,
              deletedAt: undefined,
            },
          ];
        });
      }
    }
  }
}

export function getMinMax(
  input: {
    exercise: TrainingExercise;
    attributeRange?: Attribute;
    valueL: AttributeValue;
    setNumber: number;
  },
  state: {
    selectedExercises: TrainingExercise[];
    setsNumbers: {
      exerciseId: string;
      setsNumber: number;
    }[];
    setSetsNumbers: (
      value: SetStateAction<
        {
          exerciseId: string;
          setsNumber: number;
        }[]
      >
    ) => void;
  }
): { min: number | undefined; max: number | undefined } {
  const { exercise, attributeRange, valueL, setNumber } = input;
  const { selectedExercises, setsNumbers, setSetsNumbers } = state;

  let min: number | undefined;
  let max: number | undefined;

  if (!attributeRange) return { min, max };

  const foundInOptions = attributeRange.options?.find(
    (option) => option.field === valueL.selected
  );

  if (foundInOptions) {
    if (foundInOptions.field === VolWorkSetType.Set) {
      if (
        foundInOptions.min &&
        setNumber !== undefined &&
        setNumber < foundInOptions.min
      ) {
        if (
          selectedExercises.length &&
          selectedExercises.some((e) => e.id === exercise.id)
        ) {
          const updatedSetsNumbers = [...setsNumbers];

          for (const selectedExercise of selectedExercises) {
            const existingIndex = updatedSetsNumbers.findIndex(
              (sn) => sn.exerciseId === selectedExercise.id
            );

            const newSetNumber = {
              exerciseId: selectedExercise.id,
              setsNumber: foundInOptions.min,
            };

            if (existingIndex !== -1) {
              updatedSetsNumbers[existingIndex] = newSetNumber;
            } else {
              updatedSetsNumbers.push(newSetNumber);
            }
          }

          setSetsNumbers(updatedSetsNumbers);
        } else {
          const newSetNumber = {
            exerciseId: exercise.id,
            setsNumber: foundInOptions.min,
          };
          setSetsNumbers((prev) => {
            const existingIndex = prev.findIndex(
              (sn) => sn.exerciseId === exercise.id
            );
            if (existingIndex !== -1) {
              const newSetsNumber = [...prev];
              newSetsNumber[existingIndex] = newSetNumber;
              return newSetsNumber;
            }
            return [...prev, newSetNumber];
          });
        }
      }
      if (
        foundInOptions.max &&
        setNumber !== undefined &&
        setNumber > foundInOptions.max
      ) {
        if (
          selectedExercises.length &&
          selectedExercises.some((e) => e.id === exercise.id)
        ) {
          const updatedSetsNumbers = [...setsNumbers];

          for (const selectedExercise of selectedExercises) {
            const existingIndex = updatedSetsNumbers.findIndex(
              (sn) => sn.exerciseId === selectedExercise.id
            );

            const newSetNumber = {
              exerciseId: selectedExercise.id,
              setsNumber: foundInOptions.max,
            };

            if (existingIndex !== -1) {
              updatedSetsNumbers[existingIndex] = newSetNumber;
            } else {
              updatedSetsNumbers.push(newSetNumber);
            }
          }

          setSetsNumbers(updatedSetsNumbers);
        } else {
          const newSetNumber = {
            exerciseId: exercise.id,
            setsNumber: foundInOptions.max,
          };
          setSetsNumbers((prev) => {
            const existingIndex = prev.findIndex(
              (sn) => sn.exerciseId === exercise.id
            );
            if (existingIndex !== -1) {
              const newSetsNumber = [...prev];
              newSetsNumber[existingIndex] = newSetNumber;
              return newSetsNumber;
            }
            return [...prev, newSetNumber];
          });
        }
      }
    }
    min = foundInOptions.min;
    max = foundInOptions.max;
  } else {
    min = attributeRange.min;
    max = attributeRange.max;
  }

  return { min, max };
}
