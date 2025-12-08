import type { DragEndEvent } from '@dnd-kit/core';

import type useTrainingMembers from '../hooks/use-members.hook';
import type useTrainingMembersSubgroups from '../hooks/use-subgroups.hook';
import { handleAddMembersSubgroup } from './actions-subgroups';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { IGroupCtx } from '@/store/group.provider';
import type { IMainContext, useMain } from '@/store/main.provider';
import type {
  ITrainerDayViewContext,
  TrainerDayViewCtxExtended,
} from '@/store/trainer-day-view.provider';

export const handleOnDragEnd = async (
  input: DragEndEvent,
  context: {
    useMain: IMainContext;
    useGroup: IGroupCtx;
    useTrainerDayViewContext: ITrainerDayViewContext;
    useTrainingMembersSubgroups: ReturnType<typeof useTrainingMembersSubgroups>;
    useTrainingMembers: ReturnType<typeof useTrainingMembers>;
  }
) => {
  const { active, over } = input;

  const {
    useMain,
    useGroup,
    useTrainerDayViewContext,
    useTrainingMembersSubgroups,
    useTrainingMembers,
  } = context;

  const training = useTrainerDayViewContext.training;
  const component = useTrainerDayViewContext.component;

  if (!training || !component) return;

  const { members } = useTrainingMembers;

  if (!over) {
    const user = members.find((m) => m.uid === active.id);
    if (!user) return;
    handleAddMembersSubgroup(
      { member: user },
      {
        useTrainerDayViewContext: {
          ...useTrainerDayViewContext,
          training,
          component,
        },
        useGroup,
      }
    );
  } else {
    onDragEndSubgroup(input, {
      useMain,
      useTrainerDayViewContext: {
        ...useTrainerDayViewContext,
        training,
        component,
      },
      useTrainingMembersSubgroups,
    });
  }
};

const onDragEndSubgroup = (
  input: DragEndEvent,
  context: {
    useMain: ReturnType<typeof useMain>;
    useTrainerDayViewContext: TrainerDayViewCtxExtended;
    useTrainingMembersSubgroups: ReturnType<typeof useTrainingMembersSubgroups>;
  }
) => {
  const { active, over } = input;

  const { useMain, useTrainerDayViewContext, useTrainingMembersSubgroups } =
    context;

  const { users } = useMain;
  const { setTraining, component, setComponent } = useTrainerDayViewContext;

  const { subgroups, setSubgroups, changedSubgroupIds, setChangedSubgroupIds } =
    useTrainingMembersSubgroups;

  // remove member from all subgroups, including the default subgroup
  let updatedSubgroups = [...subgroups];

  // find from which subgroup the member is being dragged from and add it to changedSubgroupIds
  const fromSubgroup = updatedSubgroups.find(
    (s) => s.membersIds.includes(active.id.toString()) && !s.parentId
  );

  if (fromSubgroup && fromSubgroup.id === over?.id) return;

  if (fromSubgroup && !changedSubgroupIds.includes(fromSubgroup.id))
    setChangedSubgroupIds((prev) => [...prev, fromSubgroup.id]);

  updatedSubgroups.forEach((s) => {
    if (!s.membersIds || s.parentId) return;
    s.membersIds = s.membersIds.filter((id) => id !== active.id);
  });

  // Add member to the new subgroup
  if (over?.id === DEFAULT_SUBGROUP_ID) {
    const newMember = users.data.find((user) => user.uid === active.id);

    if (!newMember) return;

    const defaultSubgroup = updatedSubgroups.find(
      (s) => s.id === DEFAULT_SUBGROUP_ID
    );
    if (defaultSubgroup) {
      defaultSubgroup.membersIds.push(active.id.toString());
      defaultSubgroup.members?.push(newMember);
    }
  } else {
    const targetSubgroup = updatedSubgroups.find((s) => s.id === over?.id);

    if (!targetSubgroup) return;

    targetSubgroup.membersIds.push(active.id.toString());

    if (targetSubgroup && !changedSubgroupIds.includes(targetSubgroup.id))
      setChangedSubgroupIds((prev) => [...prev, targetSubgroup.id]);
  }

  // delete custom workloads subgroup
  const foundCustomUserSubgroup = component.subgroups.find(
    (subgroup) =>
      subgroup.parentId && subgroup.membersIds.includes(active.id.toString())
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
    return {
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === updatedComponent.id) return updatedComponent;
        return c;
      }),
    };
  });
};
