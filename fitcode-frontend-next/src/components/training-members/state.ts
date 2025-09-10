'use client';

import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import { DEFAULT_SUBGROUP_ID } from '../trainer-day-view/constant';
import { handleAddSubgroup } from '../trainer-day-view/state';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { User } from '@/controller/user/type/user.type';

export async function handleAddMembersSubgroup(
  input: { member: User },
  state: {
    training: Training | undefined;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent | undefined;
    setComponent: SetState<TrainingComponent | undefined>;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setSelectedAthlete: SetStateNullable<User>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { member } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    setSelectedSubgroup,
    setSelectedAthlete,
    setDetectedChanges,
  } = state;

  if (!training || !component) return;

  const createSubgroup = {
    name: `Subgroup ${component.subgroups.filter((s) => !s.parentId && s.id !== DEFAULT_SUBGROUP_ID).length + 1}`,
    membersIds: [member.uid],
  };

  const sameSubgroup = component.subgroups.find(
    (subgroup) => subgroup.name === createSubgroup.name
  );

  if (sameSubgroup && sameSubgroup.membersIds.includes(member.uid))
    return toast.error('Subgroup for this member already exists');
  else if (sameSubgroup && !sameSubgroup.membersIds.includes(member.uid)) {
    // subgroup already exists, add the member to it
    const newSubgroup = {
      ...sameSubgroup,
      membersIds: [...sameSubgroup.membersIds, member.uid],
    };

    let newSubgroups = [...component.subgroups].map((subgroup) =>
      subgroup.membersIds.includes(member.uid)
        ? {
            ...subgroup,
            membersIds: subgroup.membersIds.filter((id) => id !== member.uid),
          }
        : subgroup
    );

    newSubgroups = [...newSubgroups].map((subgroup) =>
      subgroup.id === newSubgroup.id ? newSubgroup : subgroup
    );

    const foundCustomUserSubgroup = component.subgroups.find(
      (subgroup) =>
        subgroup.parentId && subgroup.membersIds.includes(member.uid)
    );

    newSubgroups = newSubgroups.filter(
      (sg) => sg.id !== foundCustomUserSubgroup?.id
    );

    const newComponent = { ...component, subgroups: newSubgroups };
    setComponent(newComponent);
    setTraining({
      ...training,
      components: training.components.map((c) =>
        c.id === newComponent.id ? newComponent : c
      ),
    });

    setDetectedChanges(true);
    return;
  }

  // check if the member already exists in a subgroup and if he does, remove him from that subgroup
  const memberSubgroup = component.subgroups.find(
    (subgroup) => subgroup.membersIds.includes(member.uid) && !subgroup.parentId
  );

  if (memberSubgroup) {
    // member already exists in a subgroup, remove him from it
    const newSubgroups = [...component.subgroups].map((subgroup) =>
      subgroup.membersIds.includes(member.uid) && !subgroup.parentId
        ? {
            ...subgroup,
            membersIds: subgroup.membersIds.filter((id) => id !== member.uid),
          }
        : subgroup
    );

    const supersets = [...component.supersets].map((s) => ({
      ...s,
      exercises: [...s.exercises].map((e) => ({ ...e })),
    }));

    const newComponent = {
      ...component,
      subgroups: newSubgroups,
      supersets: supersets,
    };

    await handleAddSubgroup({
      training,
      setTraining,
      component: newComponent!,
      setComponent,
      createSubgroup,
      setCreateSubgroup: undefined,
      setDetectedChanges,
      setSelectedSubgroup,
      setSelectedAthlete,
    });

    return;
  }

  await handleAddSubgroup({
    training,
    setTraining,
    component: component!,
    setComponent,
    createSubgroup,
    setCreateSubgroup: undefined,
    setDetectedChanges,
    setSelectedSubgroup,
    setSelectedAthlete,
  });
}

export function updateSelectedAthlete(input: {
  member: User;
  selectedAthlete: User | undefined;
  setSelectedAthlete: SetState<User | undefined>;
  component: TrainingComponent | undefined;
  selectedSubgroup: Subgroup | null;
  setSelectedSubgroup: SetState<Subgroup | null>;
  subgroupId: string;
}) {
  const {
    member,
    selectedAthlete,
    setSelectedAthlete,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    subgroupId,
  } = input;

  if (subgroupId !== (selectedSubgroup?.id || DEFAULT_SUBGROUP_ID)) return;

  const foundCustomUserSubgroup = component?.subgroups.find(
    (subgroup) => subgroup.parentId && subgroup.membersIds.includes(member.uid)
  );

  if (selectedAthlete?.uid === member.uid) {
    // update selectedSubgroup on member deselect
    if (foundCustomUserSubgroup) {
      const parentSubgroup = component?.subgroups.find(
        (subgroup) => subgroup.id === foundCustomUserSubgroup.parentId
      );

      if (parentSubgroup) setSelectedSubgroup(parentSubgroup);
      else setSelectedSubgroup(null);
    }

    setSelectedAthlete(undefined);
    return;
  }

  setSelectedAthlete(member);

  if (foundCustomUserSubgroup) setSelectedSubgroup(foundCustomUserSubgroup);
}

export function getOrCreateCustomWorkloadsSubgroup(input: {
  selectedAthlete: User;
  component: TrainingComponent;
  setComponent: SetStateNullable<TrainingComponent>;
  selectedSubgroup: Subgroup | null;
  setSelectedSubgroup: SetState<Subgroup | null>;
  setTraining: SetStateNullable<Training>;
}): Subgroup {
  const {
    selectedAthlete,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    setTraining,
  } = input;

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

export function getFieldsFromSubgroup(
  subgroup: Subgroup,
  state: {
    selectedExercises: TrainingExercise[];
    exercise: TrainingExercise;
    setSupersets: SetState<Superset[]>;
    setSelectedExercises: SetState<TrainingExercise[]>;
    setSetsNumbers: SetState<{ exerciseId: string; setsNumber: number }[]>;
  }
): {
  supersets: Superset[];
  selectedExercises: TrainingExercise[];
  exercise: TrainingExercise | undefined;
  setsNumbers: {
    exerciseId: string;
    setsNumber: number;
  }[];
} {
  const {
    setSupersets,
    setSelectedExercises,
    setSetsNumbers,
    selectedExercises,
    exercise,
  } = state;

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
