import { v4 } from 'uuid';
import { Institution } from '../entity/institution.entity';
import { generateRandomName } from '../../../test/common/utils/random.util';

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
    trainerIds: data?.trainerIds || [global.trainer.uid],
    athleteIds: data?.athleteIds || [global.athlete.uid],
    imageUrl: data?.imageUrl || null,
  };
}
