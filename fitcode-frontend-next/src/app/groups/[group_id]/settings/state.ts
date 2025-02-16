import { LINK_GROUPS } from '@/common/constant/navigation.constant';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Group } from '@/controller/group/type/group.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export async function handleUpdateGroup(
  token: string,
  input: Group,
  state: {
    router: AppRouterInstance;
    setGroup: SetState<Group>;
  }
) {
  const { router } = state;

  if (input.name.length < 3) {
    toast.error('Group name must be at least 3 characters long.');
    return;
  }

  handleApiRequest(
    router,
    () => GroupController.update(token, input.id, { name: input.name }),
    (updatedGroup) => {
      state.setGroup(updatedGroup);
      toast.success('Group updated successfully.');
    },
    undefined,
    'Failed to update group.'
  );
}

export async function handleDeleteGroup(
  token: string,
  input: { groupId: string },
  state: {
    router: AppRouterInstance;
  }
) {
  const { router } = state;

  handleApiRequest(
    router,
    async () => {
      // return await GroupController.deleteGroup(token, input.groupId);
      return null;
    },
    () => {
      toast.success('Group deleted successfully.');
      state.router.push(LINK_GROUPS.href);
    },
    undefined,
    'Failed to delete group.'
  );
}
