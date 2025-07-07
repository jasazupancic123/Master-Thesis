import { v4 } from 'uuid';
import { Group } from '../entity/group.entity';
import { generateRandomName } from '../../../test/common/utils/random.util';

export function generateGroupStub(data?: Partial<Group>): Group {
  return {
    id: v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    name: data?.name ?? generateRandomName(),
    ownerId: data?.ownerId,
    membersIds: data?.membersIds || [global.athlete.uid],
    institutionId: data?.institutionId || v4(),
    cycles: data?.cycles || [],
  };
}
