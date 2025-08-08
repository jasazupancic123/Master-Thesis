import toast from 'react-hot-toast';

import {
  NUM_MAX_EXERCISES_PER_SUPERSET,
  NUM_MAX_SUPERSETS,
} from '../trainer-day-view/constant';
import { COLOR } from '@/common/constant/browser.constant';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { Pagination } from '@/common/type/paginate.type';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { TrainingService } from '@/controller/training/training.service';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingInfo } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export function handleAddExerciseToSupersetComponent(
  input: {
    selectedExercisesIds: string[];
    allExercises: Exercise[];
  },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    setTrainings: SetState<TrainingInfo[]>;
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
    supersets: Superset[];
    setSupersets: SetState<Superset[]>;
    setOpenAddExerciseModal: SetState<boolean>;
    setDetectedChanges: SetState<boolean>;
    setPagination: SetState<Pagination>;
  }
) {
  const { selectedExercisesIds, allExercises } = input;

  const {
    training,
    setTraining,
    setTrainings,
    component,
    setComponent,
    selectedSubgroup,
    setSearch,
    supersets: supersetsState,
    setOpenAddExerciseModal,
    setDetectedChanges,
    setSelectedSubgroup,
    setPagination,
  } = state;

  setSearch('');
  setPagination((prev) => ({
    ...prev,
    page: 1,
  }));
  // get only new exercises
  const exercisesIdsToAdd =
    supersetsState && supersetsState.length
      ? [...selectedExercisesIds].filter(
          (id) =>
            !supersetsState
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

            let attribute = method?.attributes.find(
              (ar) => ar.field === p.field
            );
            if (attribute) {
              const foundInOptions = attribute.options?.find(
                (o) => o.field === p.defaultValue
              );
              if (foundInOptions) attribute = foundInOptions;
            }

            return {
              field: p.field,
              selected: p.defaultValue,
              value:
                attribute &&
                attribute.min !== undefined &&
                attribute.max !== undefined
                  ? Math.ceil((attribute.min + attribute.max) / 2)
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
      attributes: component?.method?.attributes || [],
      params: exercise?.defaultParams || [],
      sets: exercise?.defaultParams
        ? Array.from({ length: 3 }, (_, i) => ({
            setNumber: i + 1,
            paramValuesL: paramValues,
            ...(exercise.isBilateral && { paramValuesR: paramValues }),
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

      const updatedTraining =
        component.id === WARMUP_ID
          ? { ...training, warmup: updatedWOrC }
          : { ...training, cooldown: updatedWOrC };

      const minimalTraining = TrainingService.trainingToInfo(updatedTraining);

      setComponent(updatedWOrC);
      setTraining(updatedTraining);
      setTrainings((prev) =>
        prev.map((t) => (t.id === minimalTraining.id ? minimalTraining : t))
      );
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

      const updatedTraining =
        component.id === WARMUP_ID
          ? { ...training, warmup: updatedWOrC }
          : { ...training, cooldown: updatedWOrC };

      const minimalTraining = TrainingService.trainingToInfo(updatedTraining);

      setComponent(updatedWOrC);
      setTraining(updatedTraining);
      setTrainings((prev) =>
        prev.map((t) => (t.id === minimalTraining.id ? minimalTraining : t))
      );
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

    const numberOfAvailableMembers =
      training.membersIds.length -
      component.subgroups.reduce(
        (acc, subgroup) => acc + subgroup.membersIds.length,
        0
      );

    // insert future workload data
    const prescribedStats = [...training.prescribedStats];
    supersets.map((s) =>
      s.exercises.map((e) => {
        const { intensity, volume } = TrainingService.getAverageIntVol(e.sets);
        const found = prescribedStats.find((v) => v.exerciseId === e.id);

        if (found) {
          found.numMembers = numberOfAvailableMembers;
          found.intensity = intensity;
          found.volume = volume;
        } else {
          prescribedStats.push({
            exerciseId: e.id,
            rootComponentId: component.component?.id || '',
            numMembers: numberOfAvailableMembers,
            intensity,
            volume,
          });
        }
      })
    );

    setDetectedChanges(true);
    const newTraining: Training = {
      ...training,
      components: updatedComponents,
      prescribedStats,
    };

    const minimalTraining = TrainingService.trainingToInfo(newTraining);

    setTraining(newTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === minimalTraining.id ? minimalTraining : t))
    );
    setOpenAddExerciseModal(false);
  } else {
    // update subgroup's future workload values
    const prescribedStats = [...selectedSubgroup.subgroup.prescribedStats];
    supersets.map((s) =>
      s.exercises.map((e) => {
        const { intensity, volume } = TrainingService.getAverageIntVol(e.sets);
        const found = prescribedStats.find((v) => v.exerciseId === e.id);

        if (found) {
          found.numMembers = selectedSubgroup.subgroup!.membersIds.length;
          found.intensity = intensity;
          found.volume = volume;
        } else {
          prescribedStats.push({
            exerciseId: e.id,
            rootComponentId: component.component?.id || '',
            numMembers: selectedSubgroup.subgroup!.membersIds.length,
            intensity,
            volume,
          });
        }
      })
    );

    // update subgroup's supersets
    const updatedSubgroup = {
      ...selectedSubgroup.subgroup,
      supersets: [...supersets],
      prescribedStats,
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
    setSelectedSubgroup({
      index: selectedSubgroup.index,
      subgroup: updatedSubgroup,
    });
  }
}
