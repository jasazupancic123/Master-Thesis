import { LINK_GROUPS } from '@/common/constant/navigation.constant';
import { SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Group } from '@/controller/group/type/group.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { NextRouter } from 'next/router';
import toast from 'react-hot-toast';

export async function handleUpdateGroup(
  token: string,
  selectedGroup: Group,
  setSelectedGroup: SetState<Group>
) {
  if (selectedGroup.name.length < 3) {
    toast.error('Group name must be at least 3 characters long.');
    return;
  }

  try {
    const updatedGroup = await GroupController.update(token, selectedGroup.id, {
      name: selectedGroup.name,
    });

    setSelectedGroup(updatedGroup);
    toast.success('Group updated successfully.');
  } catch (e) {
    toast.error('Failed to update group.');
  }
}

export async function handleDeleteGroup(
  groupId: string,
  router: AppRouterInstance
) {
  try {
    // TODO: await GroupController.deleteGroup(token, selected.group?.id || '');
    toast.success('Group deleted successfully.');
    router.push(LINK_GROUPS.href);
  } catch (e) {
    toast.error('Failed to delete group.');
  }
}
