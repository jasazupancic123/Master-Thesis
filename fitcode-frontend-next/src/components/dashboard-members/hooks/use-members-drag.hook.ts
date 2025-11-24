import { AuthUser } from '@/core/auth/type/user.type';
import { Group } from '@/core/group/type/group.type';
import { useDashboard } from '@/store/dashboard.provider';
import {
  useSensors,
  useSensor,
  PointerSensor,
  TouchSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function useDashboardMembersDrag(
  allInstitutionMembers: AuthUser[]
) {
  const { selectedInstitution, selectedGroups, addGroupMember, updateGroup } =
    useDashboard();

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
    const groupId = over?.id as string;

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

    const isTrainer = selectedInstitution?.trainers.some(
      (t) => t.uid === user.uid
    );

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
