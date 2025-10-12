import { AuthUser } from '@/controller/auth/type/user.type';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-day-view/constant';
import { SetState } from '@/common/type/state.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { updateGlobalStates } from '@/components/trainer-day-view/state';
import toast from 'react-hot-toast';
import { useGroup } from '@/store/group.provider';
import {
  TrainerDayViewProviderReturnType,
  TrainerDayViewProviderReturnTypeDefined,
} from '@/store/trainer-day-view.provider';

export const handleAddMembersSubgroup = (
  input: { member: AuthUser },
  context: {
    useGroup: ReturnType<typeof useGroup>;
    useTrainerDayViewContext: TrainerDayViewProviderReturnTypeDefined;
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

    handleAddSubgroup(
      {
        createSubgroup,
        setCreateSubgroup: undefined,
      },
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
    useTrainerDayViewContext: TrainerDayViewProviderReturnTypeDefined;
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
    mainSet: component.mainSet,
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

  const newComponent = {
    ...component,
    subgroups: updatedSubgroups,
  };

  setSelectedAthlete(undefined);
  setSelectedSubgroup(newSubgroup);

  setComponent(newComponent);

  updateGlobalStates(
    training,
    component,
    newComponent,
    setTraining,
    component.id === WARMUP_ID || component.id === COOLDOWN_ID
  );

  setCreateSubgroup?.({ name: '', membersIds: [] });
  setDetectedChanges(true);
};

export const updateSelectedAthleteSubgroup = (
  input: {
    member: AuthUser;
    subgroupId: string;
  },
  context: {
    useTrainerDayViewContext: TrainerDayViewProviderReturnType;
  }
) => {
  const { member, subgroupId } = input;

  const { useTrainerDayViewContext } = context;

  const training = useTrainerDayViewContext.training;
  const component = useTrainerDayViewContext.component;

  const {
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
  } = useTrainerDayViewContext;

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
};
