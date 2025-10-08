import { DropResult } from 'react-beautiful-dnd';
import { SetState } from '@/common/type/state.type';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-day-view/constant';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { AuthUser } from '@/controller/auth/type/user.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { handleAddMembersSubgroup } from './actions-subgroups';

export const handleOnDragEnd = async (
  input: { result: DropResult },
  state: {
    users: AuthUser[];
    training: Training;
    setTraining: SetState<Training | undefined>;
    component: TrainingComponent;
    setComponent: SetState<TrainingComponent | undefined>;
    subgroups: Subgroup[];
    setSubgroups: SetState<Subgroup[]>;
    changedSubgroupIds: string[];
    setChangedSubgroupIds: SetState<string[]>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    members: AuthUser[];
    setDetectedChanges: SetState<boolean>;
    selectedAthlete: AuthUser | undefined;
    setSelectedAthlete: SetState<AuthUser | undefined>;
  }
) => {
  const { result } = input;
  const {
    users,
    members,
    training,
    setTraining,
    component,
    setComponent,
    subgroups,
    setSubgroups,
    changedSubgroupIds,
    setChangedSubgroupIds,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
    setDetectedChanges,
  } = state;

  const { draggableId, destination } = result;

  if (!destination) {
    const user = members.find((m) => m.uid === draggableId);
    if (!user) return;
    handleAddMembersSubgroup(
      { member: user },
      {
        training,
        setTraining,
        component,
        setComponent,
        setDetectedChanges,
        selectedSubgroup,
        setSelectedSubgroup,
        selectedAthlete,
        setSelectedAthlete,
      }
    );
  } else {
    onDragEndSubgroup(result, {
      setTraining,
      component,
      setComponent,
      users,
      subgroups,
      setSubgroups,
      changedSubgroupIds,
      setChangedSubgroupIds,
    });
  }
};

export const onDragEndSubgroup = (
  { destination, draggableId }: DropResult,
  state: {
    setTraining: SetState<Training | undefined>;
    component: TrainingComponent;
    setComponent: SetState<TrainingComponent | undefined>;
    users: AuthUser[];
    subgroups: Subgroup[];
    setSubgroups: SetState<Subgroup[]>;
    changedSubgroupIds: string[];
    setChangedSubgroupIds: SetState<string[]>;
  }
) => {
  if (!destination) return;

  const {
    setTraining,
    component,
    setComponent,
    users,
    subgroups,
    setSubgroups,
    changedSubgroupIds,
    setChangedSubgroupIds,
  } = state;

  // remove member from all subgroups, including the default subgroup
  let updatedSubgroups = [...subgroups];

  // find from which subgroup the member is being dragged from and add it to changedSubgroupIds
  const fromSubgroup = updatedSubgroups.find(
    (s) => s.membersIds.includes(draggableId) && !s.parentId
  );

  if (fromSubgroup && fromSubgroup.id === destination.droppableId) return;

  if (fromSubgroup && !changedSubgroupIds.includes(fromSubgroup.id))
    setChangedSubgroupIds((prev) => [...prev, fromSubgroup.id]);

  updatedSubgroups.forEach((s) => {
    if (!s.membersIds || s.parentId) return;
    s.membersIds = s.membersIds.filter((id) => id !== draggableId);
  });

  // Add member to the new subgroup
  if (destination.droppableId === DEFAULT_SUBGROUP_ID) {
    const newMember = users.find((user) => user.uid === draggableId);

    if (!newMember) return;

    const defaultSubgroup = updatedSubgroups.find(
      (s) => s.id === DEFAULT_SUBGROUP_ID
    );
    if (defaultSubgroup) {
      defaultSubgroup.membersIds.push(draggableId);
      defaultSubgroup.members?.push(newMember);
    }
  } else {
    const targetSubgroup = updatedSubgroups.find(
      (s) => s.id === destination.droppableId
    );

    if (!targetSubgroup) return;

    targetSubgroup.membersIds.push(draggableId);

    if (targetSubgroup && !changedSubgroupIds.includes(targetSubgroup.id))
      setChangedSubgroupIds((prev) => [...prev, targetSubgroup.id]);
  }

  // delete custom workloads subgroup
  const foundCustomUserSubgroup = component.subgroups.find(
    (subgroup) => subgroup.parentId && subgroup.membersIds.includes(draggableId)
  );

  updatedSubgroups = updatedSubgroups.filter(
    (sg) =>
      sg.id !== foundCustomUserSubgroup?.id && sg.id !== DEFAULT_SUBGROUP_ID
  );

  const updatedComponent: TrainingComponent = {
    ...component,
    subgroups: updatedSubgroups,
  };

  setSubgroups(updatedSubgroups);
  setComponent((prev) => {
    if (!prev) return prev;

    return updatedComponent;
  });

  setTraining((prev) => {
    if (!prev) return prev;

    if (updatedComponent.id === WARMUP_ID) {
      return {
        ...prev,
        warmup: updatedComponent,
      };
    } else if (updatedComponent.id === COOLDOWN_ID) {
      return {
        ...prev,
        cooldown: updatedComponent,
      };
    }

    return {
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === updatedComponent.id) {
          return updatedComponent;
        }
        return c;
      }),
    };
  });
};
