import { generateRandomName } from '@test/common/utils/random.util';
import { v4 } from 'uuid';

import { GLOBAL_EXERCISE_OWNER } from '../constant/global-exercise-owner.constant';
import type { Exercise } from '../entity/exercise.entity';

export function generateExerciseStub(data?: Partial<Exercise>): Exercise {
  return {
    id: data?.id || v4(),
    name: data?.name || generateRandomName(),
    componentIds: data?.componentIds || ['other'],
    ownerId: data?.ownerId || GLOBAL_EXERCISE_OWNER,
    imageUrl: data?.imageUrl || undefined,
    videoUrl: data?.videoUrl || undefined,
    instruction: data?.instruction || '',
    attributeValues: data?.attributeValues || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };
}
