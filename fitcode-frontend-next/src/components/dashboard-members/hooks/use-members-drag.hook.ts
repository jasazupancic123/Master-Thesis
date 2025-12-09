import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import toast from 'react-hot-toast';

import type { Group } from '@/core/institution/type/group.type';
import type { User } from '@/core/user/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function useDashboardMembersDrag(allInstitutionMembers: User[]) {
  const { institution } = useMain();
  const { selectedGroups, addGroupMember, updateGroup } = useDashboard();

  const [isDragging, setIsDragging] = useState(false);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 0, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const onUserDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    setActiveMemberId(event.active.id as string);
  };

  const onUserDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    const userId = active.id as string;
    const groupId = over?.data.current?.groupId as string | undefined;

    if (!groupId) return;

    const user = allInstitutionMembers.find((u) => u.uid === userId);
    const group = selectedGroups.find((g) => g.id === groupId);

    if (!user || !group) return;

    const isMemberInGroup = group.trainerIds
      .concat(group.membersIds)
      .includes(user.uid);

    if (isMemberInGroup) {
      toast.error(`${user.displayName} is already in ${group.name}`);
      setActiveMemberId(null);
      return;
    }

    const isTrainer = institution?.trainers.some((t) => t.uid === user.uid);

    if (isTrainer) {
      const updatedGroup: Group = {
        ...group,
        trainerIds: [group.trainerIds, user.uid].flat(),
      };

      await updateGroup(updatedGroup.id, updatedGroup);

      toast.success('Trainer added successfully to group');
      return;
    }

    await addGroupMember(user, groupId);

    toast.success('User added successfully to group');

    setActiveMemberId(null);
  };

  return {
    onUserDragStart,
    onUserDragEnd,
    sensors,
    activeMemberId,
    isDragging,
  };
}
