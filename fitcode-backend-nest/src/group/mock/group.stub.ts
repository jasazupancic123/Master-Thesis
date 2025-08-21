import { v4 } from 'uuid';

import { generateRandomName } from '@src/common/utils/random.util';

import type { Group } from '../entity/group.entity';

export function generateGroupStub(data?: Partial<Group>): Group {
  return {
    id: data?.id || v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    name: data?.name ?? generateRandomName(),
    ownerId: data?.ownerId || global.trainer.uid,
    membersIds: data?.membersIds || [global.athlete.uid],
    institutionId: data?.institutionId || v4(),
    cycles: data?.cycles || [],
  };
}
