import toast from 'react-hot-toast';

import { COLOR } from '@/common/constant/color.constant';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { Pagination } from '@/common/type/paginate.type';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Method } from '@/controller/method/type/method.type';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import {
  NUM_MAX_EXERCISES_PER_SUPERSET,
  NUM_MAX_SUPERSETS,
} from '../trainer-group-day-view/constant/supersets.constant';

export const updateSupersets = (
  supersets: Superset[],
  exercisesToAdd: TrainingExercise[],
  mainSet: MainSet
): Superset[] | null => {
  if (!Array.isArray(supersets)) supersets = [];
  if (supersets.length === 0)
    supersets.push({ exercises: [], color: COLOR[supersets.length] });

  const maxExercisesPerSuperset =
    mainSet === MainSet.CIRCUIT ? 32 : NUM_MAX_EXERCISES_PER_SUPERSET;
  const maxSupersets = mainSet === MainSet.CIRCUIT ? 1 : NUM_MAX_SUPERSETS;

  let i = 0;
  for (const superset of supersets) {
    while (
      superset.exercises.length < maxExercisesPerSuperset &&
      i < exercisesToAdd.length
    ) {
      const exerciseToAdd = exercisesToAdd[i]; // get the current exercise
      if (exerciseToAdd) superset.exercises.push({ ...exerciseToAdd });

      i++;
    }

    if (i === exercisesToAdd.length)
      break; // stop if no exercises left
    else if (supersets.indexOf(superset) === supersets.length - 1) {
      // if this is the last superset, add a new one if there are still exercises to add
      if (supersets.length === maxSupersets) {
        toast.error(
          'Added exercises exceed the maximum number of exercises allowed'
        );
        return null;
      }

      if (mainSet === MainSet.BLOCK) {
        supersets.push({
          exercises: [],
          color: COLOR[supersets.length],
        });
      }
    }
  }

  return supersets;
};

export function getTrainingExercisesFromExercises(
  exercisesIdsToAdd: string[],
  allExercises: Exercise[],
  component: TrainingComponent,
  method?: Method,
  minSets?: number,
  maxSets?: number
): TrainingExercise[] {
  return exercisesIdsToAdd.map((id) => {
    const exercise = allExercises.find((e) => e.id === id);
    const paramValues =
      (exercise?.defaultParams &&
        (exercise?.defaultParams
          .map((p) => {
            if (p.field === ParamType.VolWorkSets) return undefined;

            const attribute = method?.attributes
              ?.map((a) => a.options?.find((o) => o.field === p.defaultValue))
              .find(Boolean);

            return {
              field: p.field,
              selected: p.defaultValue,
              value:
                attribute &&
                attribute.min !== undefined &&
                attribute.max !== undefined
                  ? Math.ceil((attribute.min + attribute.max) / 2)
                  : p.options?.find((o) => o.field === p.defaultValue)
                      ?.defaultValue,
            } as AttributeValue;
          })
          .filter((p) => p !== undefined) as AttributeValue[])) ||
      [];

    const setsNumber =
      minSets !== undefined && maxSets !== undefined
        ? Math.floor((minSets + maxSets) / 2)
        : minSets || maxSets || 3;

    return {
      id,
      exercise: exercise,
      periodized: false,
      attributes: component?.method?.attributes || [],
      params: exercise?.defaultParams || [],
      sets: exercise?.defaultParams
        ? Array.from({ length: setsNumber }, (_, i) => ({
            setNumber: i + 1,
            paramValuesL: paramValues,
            ...(exercise.isUnilateral && { paramValuesR: paramValues }),
          }))
        : [],
    };
  });
}

export function handleAddExerciseToSupersetComponent(
  input: {
    selectedExercisesIds: string[];
    allExercises: Exercise[];
    minSets: number | undefined;
    maxSets: number | undefined;
  },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    setTrainings: SetState<Training[]>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setSearch: SetState<string>;
    supersets: Superset[];
    setSupersets: SetState<Superset[]>;
    setOpenAddExerciseModal: SetState<boolean>;
    setDetectedChanges: SetState<boolean>;
    setPagination: SetState<Pagination>;
  }
) {
  const { selectedExercisesIds, allExercises, minSets, maxSets } = input;

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

  // if it's custom workloads subgroup, then dissable
  if (selectedSubgroup?.parentId) return;

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
  const exercisesToAdd = getTrainingExercisesFromExercises(
    exercisesIdsToAdd,
    allExercises,
    component,
    method,
    minSets,
    maxSets
  );

  if (component.id === WARMUP_ID || component.id === COOLDOWN_ID) {
    // handle warmup or cooldown component, don't update prescribed stats
    const wOrC =
      component.id === WARMUP_ID
        ? { ...training.warmup }
        : { ...training.cooldown };

    const oldSupersets = !selectedSubgroup
      ? wOrC.supersets
      : selectedSubgroup?.supersets;

    const supersets = updateSupersets(
      oldSupersets,
      [...exercisesToAdd],
      wOrC.mainSet
    );

    if (!supersets) return;

    const updatedWOrC = {
      ...wOrC,
    };
    if (!selectedSubgroup) updatedWOrC.supersets = [...supersets];
    else {
      const updatedSubgroup = {
        ...selectedSubgroup,
        supersets: [...supersets],
      };

      const updatedSubgroups = [
        ...component.subgroups.map((s) =>
          s.id === selectedSubgroup.id ? updatedSubgroup : s
        ),
      ];

      updatedWOrC.subgroups = updatedSubgroups;
    }

    updatedWOrC.subgroups = CustomWorkloadsSubgroupsService.addExercises(
      updatedWOrC,
      selectedSubgroup,
      [...exercisesToAdd]
    );

    const updatedTraining =
      component.id === WARMUP_ID
        ? { ...training, warmup: updatedWOrC }
        : { ...training, cooldown: updatedWOrC };

    setComponent(updatedWOrC);
    setTraining(updatedTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
    );
    setOpenAddExerciseModal(false);
    setDetectedChanges(true);
    return;
  }

  // get training component index
  const trainingComponentIndex = [...training.components].findIndex(
    (c) => c.id === component.id
  );

  // last superset index
  const oldSupersets = selectedSubgroup?.supersets
    ? [...selectedSubgroup.supersets]
    : component
      ? component.supersets
      : training.components[trainingComponentIndex]?.supersets
        ? [...training.components[trainingComponentIndex].supersets]
        : [];

  const supersets = updateSupersets(
    oldSupersets,
    [...exercisesToAdd],
    (selectedSubgroup || component).mainSet
  );

  if (!supersets) return;

  const updatedComponents = [...training.components];
  if (!selectedSubgroup) {
    // update training component's supersets
    const updatedComponent = {
      ...updatedComponents[trainingComponentIndex],
      supersets: [...supersets],
    };

    updatedComponent.subgroups = CustomWorkloadsSubgroupsService.addExercises(
      updatedComponent,
      selectedSubgroup,
      [...exercisesToAdd]
    );

    updatedComponents[trainingComponentIndex] = { ...updatedComponent };

    const newTraining: Training = {
      ...training,
      components: updatedComponents,
    };

    setComponent(updatedComponent);
    setTraining(newTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === newTraining.id ? newTraining : t))
    );
    setDetectedChanges(true);
    setOpenAddExerciseModal(false);
  } else {
    // update subgroup's supersets
    const updatedSubgroup = {
      ...selectedSubgroup,
      supersets: [...supersets],
    };

    const updatedSubgroups = [
      ...component.subgroups.map((s) =>
        s.id === selectedSubgroup.id ? updatedSubgroup : s
      ),
    ];

    const updatedComponents = [...training.components];

    const updatedComponent = {
      ...updatedComponents[trainingComponentIndex],
      subgroups: updatedSubgroups,
    };

    updatedComponent.subgroups = CustomWorkloadsSubgroupsService.addExercises(
      updatedComponent,
      selectedSubgroup,
      [...exercisesToAdd]
    );

    updatedComponents[trainingComponentIndex] = { ...updatedComponent };

    const newTraining: Training = {
      ...training,
      components: updatedComponents,
    };

    setComponent(updatedComponent);
    setTraining(newTraining);
    setTrainings((prev) =>
      prev.map((t) => (t.id === newTraining.id ? newTraining : t))
    );
    setDetectedChanges(true);
    setOpenAddExerciseModal(false);

    setDetectedChanges(true);
    setOpenAddExerciseModal(false);
    setSelectedSubgroup(updatedSubgroup);
  }
}
