import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';

export type CreateGroupInput = Parameters<typeof GroupController.create>[1];

export async function handleCreateGroup(
  token: string,
  input: CreateGroupInput,
  setNewGroup: SetState<CreateGroupInput>,
  setOpenCreateGroupModal: SetState<boolean>
) {
  return handleApiRequest(
    () => GroupController.create(token, input),
    () => {
      setNewGroup({ name: '', membersIds: [] });
      setOpenCreateGroupModal(false);
    },
    undefined,
    'Could not create group'
  );
}
