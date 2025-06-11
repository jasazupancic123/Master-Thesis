import { COLOR } from '@/common/constant/browser.constant';
import {
  Superset,
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import toast from 'react-hot-toast';
import {
  NUM_MAX_EXERCISES_PER_SUPERSET,
  NUM_MAX_SUPERSETS,
} from '../trainer-day-view/constant';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { TrainingService } from '@/controller/training/training.service';
import { Training } from '@/controller/training/type/training.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';

export function handleAddExerciseToSupersetComponent(
  input: {
    selectedExercisesIds: string[];
    allExercises: Exercise[];
  },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    setTrainings: SetState<Training[]>;
    filteredTrainings: Training[];
    setFilteredTrainings: SetState<Training[]>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: {
      index: number;
      subgroup: Subgroup | null;
    } | null;
    setSelectedSubgroup: SetState<{
      subgroup: Subgroup | null;
      index: number;
    } | null>;
    setSearch: SetState<string>;
    supersetsWithAdd: Superset[];
    setSupersetsWithAdd: SetState<Superset[]>;
    setOpenAddExerciseModal: SetState<boolean>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { selectedExercisesIds, allExercises } = input;

  const {
    training,
    setTraining,
    setTrainings,
    filteredTrainings,
    setFilteredTrainings,
    component,
    setComponent,
    selectedSubgroup,
    setSearch,
    supersetsWithAdd,
    setSupersetsWithAdd,
    setOpenAddExerciseModal,
    setDetectedChanges,
    setSelectedSubgroup,
  } = state;

  setSearch('');
  // get only new exercises
  const exercisesIdsToAdd =
    supersetsWithAdd && supersetsWithAdd.length
      ? [...selectedExercisesIds].filter(
          (id) =>
            !supersetsWithAdd
              .map((s) => s.exercises.map((e) => e.id))
              .flat()
              .includes(id)
        )
      : selectedExercisesIds;

  const method = component?.method;
  const exercisesToAdd: TrainingExercise[] = exercisesIdsToAdd.map((id) => {
    const exercise = allExercises.find((e) => e.id === id);
    const paramValues =
      (exercise?.defaultParams &&
        (exercise?.defaultParams
          .map((p) => {
            if (p.field === 'volWorkSets') return undefined;

            let attributeRange = method?.attributeRanges.find(
              (ar) => ar.field === p.field
            );
            if (attributeRange) {
              const foundInOptions = attributeRange.options?.find(
                (o) => o.field === p.defaultValue
              );
              if (foundInOptions) attributeRange = foundInOptions;
            }

            return {
              field: p.field,
              selected: p.defaultValue,
              value:
                attributeRange &&
                attributeRange.min !== undefined &&
                attributeRange.max !== undefined
                  ? Math.ceil((attributeRange.min + attributeRange.max) / 2)
                  : p.options?.find((o) => o.field === p.defaultValue)?.options
                        ?.length
                    ? '0' //picks the first element in the options array
                    : p.options?.find((o) => o.field === p.defaultValue)
                        ?.defaultValue,
            } as AttributeValue;
          })
          .filter((p) => p !== undefined) as AttributeValue[])) ||
      [];

    return {
      id,
      exercise: exercise,
      periodized: false,
      attributeRanges: component?.method?.attributeRanges || [],
      params: exercise?.defaultParams || [],
      sets: exercise?.defaultParams
        ? Array.from({ length: 3 }, (_, i) => ({
            setNumber: i + 1,
            paramValuesL: paramValues,
            paramValuesR: paramValues,
          }))
        : [],
    };
  });

  if (component.id === WARMUP_ID || component.id === COOLDOWN_ID) {
    const wOrC =
      component.id === WARMUP_ID
        ? { ...training.warmup }
        : { ...training.cooldown };

    let supersets = !selectedSubgroup?.subgroup
      ? wOrC.supersets
      : selectedSubgroup?.subgroup.supersets;

    if (!Array.isArray(supersets)) supersets = [];
    if (supersets.length === 0)
      supersets.push({ exercises: [], color: COLOR[supersets.length] });

    for (const superset of supersets) {
      while (
        superset.exercises.length < NUM_MAX_EXERCISES_PER_SUPERSET &&
        exercisesToAdd.length > 0
      ) {
        const exerciseToAdd = exercisesToAdd.shift(); // remove from the front
        if (exerciseToAdd) superset.exercises.push({ ...exerciseToAdd });
      }

      if (exercisesToAdd.length === 0) break; // stop if no exercises left
    }

    if (!selectedSubgroup?.subgroup) {
      const updatedWOrC = {
        ...wOrC,
        supersets: [...supersets],
      };

      let updatedTraining = { ...training };

      if (component.id === WARMUP_ID) {
        updatedTraining = {
          ...updatedTraining,
          warmup: updatedWOrC,
        };
      } else {
        updatedTraining = {
          ...updatedTraining,
          cooldown: updatedWOrC,
        };
      }

      const newFilteredTrainings = [...filteredTrainings].map((t) =>
        t.id === updatedTraining.id ? updatedTraining : t
      );
      setTraining(updatedTraining);
      setTrainings((prev) =>
        prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
      );
      setFilteredTrainings(newFilteredTrainings);
      setOpenAddExerciseModal(false);
      setDetectedChanges(true);
    } else {
      const updatedSubgroup = {
        ...selectedSubgroup.subgroup,
        supersets: [...supersets],
      };

      const updatedSubgroups = [...component.subgroups];
      updatedSubgroups[selectedSubgroup.index] = updatedSubgroup;

      const updatedWOrC = {
        ...wOrC,
        subgroups: updatedSubgroups,
      };

      let updatedTraining = { ...training };
      if (component.id === WARMUP_ID) {
        updatedTraining = {
          ...updatedTraining,
          warmup: updatedWOrC,
        };
      } else {
        updatedTraining = {
          ...updatedTraining,
          cooldown: updatedWOrC,
        };
      }
      setTraining(updatedTraining);
      const newFilteredTrainings = [...filteredTrainings].map((t) =>
        t.id === updatedTraining.id ? updatedTraining : t
      );
      setTrainings((prev) =>
        prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
      );
      setFilteredTrainings(newFilteredTrainings);
      setOpenAddExerciseModal(false);
      setDetectedChanges(true);
    }
    return;
  }

  // get training component index
  const trainingComponentIndex = [...training.components].findIndex(
    (c) => c.id === component.id
  );

  // last superset index
  let supersets = selectedSubgroup?.subgroup?.supersets
    ? [...selectedSubgroup.subgroup.supersets]
    : component
      ? component.supersets
      : training.components[trainingComponentIndex]?.supersets
        ? [...training.components[trainingComponentIndex].supersets]
        : [];

  if (!Array.isArray(supersets)) supersets = [];
  if (supersets.length === 0)
    supersets.push({ exercises: [], color: COLOR[supersets.length] });

  for (const superset of supersets) {
    while (
      superset.exercises.length < NUM_MAX_EXERCISES_PER_SUPERSET &&
      exercisesToAdd.length > 0
    ) {
      const exerciseToAdd = exercisesToAdd.shift(); // remove from the front
      if (exerciseToAdd) superset.exercises.push({ ...exerciseToAdd });
    }

    if (exercisesToAdd.length === 0) break; // stop if no exercises left
  }

  // Keep creating new supersets until all exercises are added
  while (exercisesToAdd.length > 0) {
    if (supersets.length === NUM_MAX_SUPERSETS) {
      return toast.error(
        'Added exercises exceed the maximum number of exercises allowed'
      );
    }

    const newSuperset: Superset = {
      exercises: [],
      color: COLOR[supersets.length],
    };

    while (
      newSuperset.exercises.length < NUM_MAX_EXERCISES_PER_SUPERSET &&
      exercisesToAdd.length > 0
    ) {
      const exerciseToAdd = exercisesToAdd.shift();
      if (exerciseToAdd) newSuperset.exercises.push({ ...exerciseToAdd });
    }

    supersets.push(newSuperset);
  }

  const updatedComponents = [...training.components];
  if (!selectedSubgroup?.subgroup) {
    // update training component's supersets
    updatedComponents[trainingComponentIndex] = {
      ...updatedComponents[trainingComponentIndex],
      supersets: [...supersets],
    };

    const updatedComponent = {
      ...component,
      supersets: [...supersets],
    };

    const numberOfAvailableMembers =
      training.membersIds.length -
      component.subgroups.reduce(
        (acc, subgroup) => acc + subgroup.membersIds.length,
        0
      );

    // insert future workload data
    const avgFutureWorkloadValues = [...training.avgFutureWorkloadValues];
    supersets.map((s) =>
      s.exercises.map((e) => {
        const { intensity, volume } = TrainingService.getIntensityVolumeValues(
          e.sets
        );
        const found = avgFutureWorkloadValues.find(
          (v) => v.exerciseId === e.id
        );
        if (found) {
          found.numMembers = numberOfAvailableMembers;
          found.avgWorkloadValue = { intensity, volume };
        } else {
          avgFutureWorkloadValues.push({
            exerciseId: e.id,
            rootComponentId: component.component?.id || '',
            numMembers: numberOfAvailableMembers,
            avgWorkloadValue: { intensity, volume },
          });
        }
      })
    );

    setDetectedChanges(true);
    setSupersetsWithAdd([...supersets]);
    setComponent({ ...updatedComponent });
    const newTraining = {
      ...training,
      components: updatedComponents,
      avgFutureWorkloadValues,
    };

    setTraining(newTraining);
    const newFilteredTrainings = [...filteredTrainings].map((t) =>
      t.id === newTraining.id ? newTraining : t
    );
    setTrainings((prev) =>
      prev.map((t) => (t.id === newTraining.id ? newTraining : t))
    );
    setFilteredTrainings(newFilteredTrainings);
    setOpenAddExerciseModal(false);
  } else {
    // update subgroup's future workload values
    const avgFutureWorkloadValues = [
      ...selectedSubgroup.subgroup.avgFutureWorkloadValues,
    ];
    supersets.map((s) =>
      s.exercises.map((e) => {
        const { intensity, volume } = TrainingService.getIntensityVolumeValues(
          e.sets
        );
        const found = avgFutureWorkloadValues.find(
          (v) => v.exerciseId === e.id
        );
        if (found) {
          found.numMembers = selectedSubgroup.subgroup!.membersIds.length;
          found.avgWorkloadValue = { intensity, volume };
        } else {
          avgFutureWorkloadValues.push({
            exerciseId: e.id,
            rootComponentId: component.component?.id || '',
            numMembers: selectedSubgroup.subgroup!.membersIds.length,
            avgWorkloadValue: { intensity, volume },
          });
        }
      })
    );

    // update subgroup's supersets
    const updatedSubgroup = {
      ...selectedSubgroup.subgroup,
      supersets: [...supersets],
      avgFutureWorkloadValues,
    };

    const updatedSubgroups = [...component.subgroups];
    updatedSubgroups[selectedSubgroup.index] = updatedSubgroup;

    const updatedComponents = [...training.components];
    updatedComponents[trainingComponentIndex] = {
      ...updatedComponents[trainingComponentIndex],
      subgroups: updatedSubgroups,
    };

    setDetectedChanges(true);
    setOpenAddExerciseModal(false);
    setComponent({ ...component, subgroups: updatedSubgroups });
    setTraining({ ...training, components: updatedComponents });
    setSelectedSubgroup({
      index: selectedSubgroup.index,
      subgroup: updatedSubgroup,
    });
  }
}
