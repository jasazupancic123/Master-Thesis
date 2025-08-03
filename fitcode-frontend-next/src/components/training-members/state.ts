'use client';

import toast from 'react-hot-toast';

import { handleAddSubgroup } from '../trainer-day-view/state';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { User } from '@/controller/user/type/user.type';

export async function handleAddMembersSubgroup(
  input: { member: User },
  state: {
    training: Training | undefined;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent | undefined;
    setComponent: SetState<TrainingComponent | undefined>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { member } = input;
  const { training, setTraining, component, setComponent, setDetectedChanges } =
    state;

  if (!training || !component) return;

  const createSubgroup = {
    name: member.displayName || member.email,
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
      prescribedStats: [...sameSubgroup.prescribedStats].map((value) => ({
        ...value,
        numMembers: value.numMembers + 1,
      })),
    };

    let newSubgroups = [...component.subgroups].map((subgroup) =>
      subgroup.membersIds.includes(member.uid)
        ? {
            ...subgroup,
            membersIds: subgroup.membersIds.filter((id) => id !== member.uid),
            prescribedStats: [...subgroup.prescribedStats].map((value) => ({
              ...value,
              numMembers: value.numMembers - 1,
            })),
          }
        : subgroup
    );

    newSubgroups = [...newSubgroups].map((subgroup) =>
      subgroup.id === newSubgroup.id ? newSubgroup : subgroup
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
  const memberSubgroup = component.subgroups.find((subgroup) =>
    subgroup.membersIds.includes(member.uid)
  );

  if (memberSubgroup) {
    // member already exists in a subgroup, remove him from it
    const newSubgroups = [...component.subgroups].map((subgroup) =>
      subgroup.membersIds.includes(member.uid)
        ? {
            ...subgroup,
            membersIds: subgroup.membersIds.filter((id) => id !== member.uid),
            prescribedStats: [...subgroup.prescribedStats].map((value) => ({
              ...value,
              numMembers: value.numMembers - 1,
            })),
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
    updateTrainingsAvgFutureWorkload: true,
  });
}
