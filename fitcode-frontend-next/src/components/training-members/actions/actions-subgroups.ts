import toast from 'react-hot-toast';

import { updateGlobalStates } from '@/components/supersets/actions/actions-drag-exercise';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import { core } from '@/core/core.service';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { Training } from '@/core/training/type/training.type';
import type { User } from '@/core/user/type/user.type';
import type { SetState } from '@/lib/common/type/state.type';
import type { IGroupCtx, useGroup } from '@/store/group.provider';
import type { IMainContext } from '@/store/main.provider';
import type {
  ITrainerDayViewContext,
  TrainerDayViewCtxExtended,
} from '@/store/trainer-day-view.provider';

export const handleAddMembersSubgroup = (
  input: { member: User },
  context: {
    useGroup: ReturnType<typeof useGroup>;
    useTrainerDayViewContext: TrainerDayViewCtxExtended;
  }
) => {
  const { member } = input;

  const { useGroup, useTrainerDayViewContext } = context;

  const { setDetectedChanges } = useGroup;

  const { training, setTraining, component, setComponent } =
    useTrainerDayViewContext;

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
    handleAddSubgroup(
      { createSubgroup, setCreateSubgroup: undefined },
      context
    );

    return;
  }

  handleAddSubgroup(
    {
      createSubgroup,
      setCreateSubgroup: undefined,
    },
    context
  );
};

const handleAddSubgroup = (
  input: {
    createSubgroup: { name: string; membersIds: string[] };
    setCreateSubgroup:
      | SetState<{ name: string; membersIds: string[] }>
      | undefined;
  },
  context: {
    useGroup: ReturnType<typeof useGroup>;
    useTrainerDayViewContext: TrainerDayViewCtxExtended;
  }
) => {
  const { createSubgroup, setCreateSubgroup } = input;
  const { useGroup, useTrainerDayViewContext } = context;
  const { setDetectedChanges } = useGroup;
  const {
    training,
    setTraining,
    component,
    setComponent,
    setSelectedSubgroup,
    setSelectedAthlete,
  } = useTrainerDayViewContext;

  const newSubgroup: Subgroup = {
    id: `subgroup-${String(Date.now())}`,
    name: createSubgroup.name,
    supersets: [...component.supersets].map((superset) => ({
      ...superset,
      exercises: [...superset.exercises].map((exercise) => ({
        ...exercise,
      })),
    })),
    membersIds: createSubgroup.membersIds || [],
  };

  let updatedSubgroups = [...component.subgroups, newSubgroup];

  // delete custom workloads subgroup
  createSubgroup.membersIds.forEach((memberId) => {
    const foundCustomUserSubgroup = component.subgroups.find(
      (subgroup) => subgroup.parentId && subgroup.membersIds.includes(memberId)
    );

    if (!foundCustomUserSubgroup) return;

    updatedSubgroups = updatedSubgroups.filter(
      (sg) => sg.id !== foundCustomUserSubgroup?.id
    );
  });

  const newComponent = { ...component, subgroups: updatedSubgroups };

  setSelectedAthlete(undefined);
  setSelectedSubgroup(newSubgroup);
  setComponent(newComponent);
  updateGlobalStates(training, component, newComponent, setTraining);
  setCreateSubgroup?.({ name: '', membersIds: [] });
  setDetectedChanges(true);
};

export function updateSelectedAthleteSubgroup(
  athlete: User,
  subgroupId: string,
  trainerDayViewCtx: ITrainerDayViewContext
) {
  const {
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    setComponent,
    setTraining,
    setSelectedAthlete,
  } = trainerDayViewCtx;

  if (subgroupId !== (selectedSubgroup?.id || DEFAULT_SUBGROUP_ID)) return;

  setSelectedAthlete(athlete);

  if (component) {
    const virtual =
      core.training.subgroup.getVirtual(athlete.uid, component) ||
      core.training.subgroup.createVirtual(
        athlete,
        selectedSubgroup,
        component
      );

    const updatedComponent = structuredClone(component);
    updatedComponent.subgroups = [
      ...updatedComponent.subgroups.filter((s) => s.id !== virtual.id),
      virtual,
    ];

    setSelectedSubgroup(virtual);
    setComponent(updatedComponent);
    setTraining((prev) =>
      !prev
        ? undefined
        : {
            ...prev,
            components: prev.components.map((c) =>
              c.id === updatedComponent.id ? updatedComponent : c
            ),
          }
    );
  }
}

export function handleDeleteSubgroup(
  input: { subgroupId: string },
  context: {
    useMain: IMainContext;
    useGroup: IGroupCtx;
    useTrainerDayViewContext: TrainerDayViewCtxExtended;
  }
) {
  const { subgroupId } = input;
  const { useGroup, useTrainerDayViewContext, useMain } = context;
  const { setDetectedChanges } = useGroup;
  const { setTrainings } = useMain;

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedExerciseIds,
    setSelectedExerciseIds,
    setSelectedSubgroup,
  } = useTrainerDayViewContext;

  const subgroupsCopy = [...component.subgroups];
  const deletingSubgroup = subgroupsCopy.find((sg) => sg.id === subgroupId);

  let updatedSubgroups = subgroupsCopy.filter(
    (subgroup) => subgroup.id !== subgroupId
  );

  if (deletingSubgroup) {
    deletingSubgroup.membersIds.forEach((memberId) => {
      const foundCustomUserSubgroup = component.subgroups.find(
        (subgroup) =>
          subgroup.parentId && subgroup.membersIds.includes(memberId)
      );

      if (!foundCustomUserSubgroup) return;

      updatedSubgroups = updatedSubgroups.filter(
        (sg) => sg.id !== foundCustomUserSubgroup?.id
      );
    });
  }

  const newComponent = { ...component, subgroups: updatedSubgroups };

  const updatedComponents = [...training.components].map((c) =>
    c.id === component.id ? newComponent : c
  );

  const newTraining: Training = { ...training, components: updatedComponents };

  setDetectedChanges(true);
  setSelectedSubgroup(null);
  setComponent(newComponent);
  setTraining(newTraining);
  setTrainings((prev) => ({
    ...prev,
    data: prev.data.map((t) => (t.id === training.id ? newTraining : t)),
  }));

  setSelectedExerciseIds(
    component?.supersets
      .flatMap((s) => s.exercises)
      .filter((e) => selectedExerciseIds.some((se) => se === e.id))
      .map((e) => e.id) || []
  );
}
