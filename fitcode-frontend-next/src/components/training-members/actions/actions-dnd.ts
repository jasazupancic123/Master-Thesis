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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: { result: any },
  context: {
    useMain: IMainContext;
    useGroup: IGroupCtx;
    useTrainerDayViewContext: ITrainerDayViewContext;
    useTrainingMembersSubgroups: ReturnType<typeof useTrainingMembersSubgroups>;
    useTrainingMembers: ReturnType<typeof useTrainingMembers>;
  }
) => {
  const { result } = input;

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

  const { draggableId, destination } = result;

  if (!destination) {
    const user = members.find((m) => m.uid === draggableId);
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
    onDragEndSubgroup(result, {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { destination, draggableId }: any,
  context: {
    useMain: ReturnType<typeof useMain>;
    useTrainerDayViewContext: TrainerDayViewCtxExtended;
    useTrainingMembersSubgroups: ReturnType<typeof useTrainingMembersSubgroups>;
  }
) => {
  if (!destination) return;

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
    return {
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === updatedComponent.id) return updatedComponent;
        return c;
      }),
    };
  });
};
