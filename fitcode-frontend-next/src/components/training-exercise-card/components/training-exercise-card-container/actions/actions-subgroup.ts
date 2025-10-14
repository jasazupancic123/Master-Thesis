import { v4 } from 'uuid';

import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { SupersetsProviderReturnType } from '@/store/supersets.provider';
import type { TrainerDayViewProviderReturnTypeDefined } from '@/store/trainer-day-view.provider';

export function getFieldsFromSubgroup(
  input: {
    subgroup: Subgroup;
    exercise: TrainingExercise;
  },
  context: {
    useTrainerDayView: TrainerDayViewProviderReturnTypeDefined;
    useSupersets: SupersetsProviderReturnType;
  }
) {
  const { subgroup, exercise } = input;

  const { useTrainerDayView, useSupersets } = context;

  const { selectedExercises, setSelectedExercises, setSupersets } =
    useTrainerDayView;

  const { setsNumbers, setSetsNumbers } = useSupersets;

  const newSupersets = subgroup.supersets;
  setSupersets(newSupersets);

  const newSelectedExercises = subgroup.supersets
    .flatMap((s) => s.exercises)
    .filter((e) => selectedExercises.some((se) => se.id === e.id));
  setSelectedExercises(newSelectedExercises);

  const newExercise = subgroup.supersets
    .flatMap((s) => s.exercises)
    .find((e) => e.id === exercise.id);

  const newSetsNumbers = [] as {
    exerciseId: string;
    setsNumber: number;
  }[];

  newSupersets.map((superset) => {
    superset.exercises?.forEach((exercise) => {
      const setsNumber = exercise.sets.length;
      newSetsNumbers.push({
        exerciseId: exercise.id,
        setsNumber: setsNumber,
      });
    });
  });
  setSetsNumbers(newSetsNumbers);

  return {
    supersets: newSupersets,
    selectedExercises: newSelectedExercises,
    exercise: newExercise,
    setsNumbers: newSetsNumbers,
  };
}

export function getOrCreateCustomWorkloadsSubgroup(context: {
  useTrainerDayView: TrainerDayViewProviderReturnTypeDefined;
}): Subgroup | null {
  const { useTrainerDayView } = context;

  const {
    selectedAthlete,
    selectedSubgroup,
    component,
    setSelectedSubgroup,
    setComponent,
    setTraining,
  } = useTrainerDayView;

  if (!selectedAthlete) return null;

  const foundCustomUserSubgroup = component.subgroups.find(
    (subgroup) =>
      subgroup.parentId && subgroup.membersIds.includes(selectedAthlete.uid)
  );

  if (foundCustomUserSubgroup) return foundCustomUserSubgroup;

  // no custom workload subgroup for current member yet, create it
  const parentId =
    selectedSubgroup && !selectedSubgroup.parentId
      ? selectedSubgroup.id
      : DEFAULT_SUBGROUP_ID;

  const supersets = selectedSubgroup?.supersets || component.supersets || [];

  const customUserSubgroup: Subgroup = {
    id: v4(),
    name: `${selectedAthlete.displayName} Custom Subgroup`,
    parentId,
    supersets: supersets.map((s) => ({
      ...s,
      exercises: [...s.exercises].map((e) => ({
        ...e,
        sets: e.sets.map((set) => ({
          ...set,
          paramValuesL: set.paramValuesL.map((pv) => ({ ...pv })),
          paramValuesR: set.paramValuesR?.map((pv) => ({ ...pv })),
        })),
      })),
    })),
    mainSet: (selectedSubgroup || component).mainSet || MainSet.BLOCK,
    membersIds: [selectedAthlete.uid],
    members: [selectedAthlete],
  };

  const updatedComponent: TrainingComponent = {
    ...component,
    subgroups: [...component.subgroups, customUserSubgroup],
  };

  setSelectedSubgroup(customUserSubgroup);
  setComponent(updatedComponent);
  setTraining((prev) => {
    if (!prev) return prev;

    if (updatedComponent.id === WARMUP_ID) {
      return {
        ...prev,
        warmup: updatedComponent,
      };
    }

    if (updatedComponent.id === COOLDOWN_ID) {
      return {
        ...prev,
        cooldown: updatedComponent,
      };
    }

    return {
      ...prev,
      components: prev.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      ),
    };
  });

  return customUserSubgroup;
}
