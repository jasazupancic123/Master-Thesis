import { v4 } from 'uuid';

import { generateRandomName } from '@src/common/utils/random.util';

import type { Institution } from '../entity/institution.entity';

export function generateInstitutionStub(
  data?: Partial<Institution>,
): Institution {
  return {
    id: data?.id || v4(),
    createdAt: data?.createdAt || new Date(),
    updatedAt: data?.updatedAt || new Date(),
    deletedAt: data?.deletedAt || null,
    name: data?.name || generateRandomName(),
    ownerId: data?.ownerId || global.manager.uid,
    imageUrl: data?.imageUrl || null,
    members: data?.members || [],
  };
}
