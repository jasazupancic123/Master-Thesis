import slugify from 'slugify';
import { v4 } from 'uuid';

import { generateRandomName } from '@src/common/utils/random.util';

import { GLOBAL_EXERCISE_OWNER } from '../constant/global-exercise-owner.constant';
import type { Exercise } from '../entity/exercise.entity';

export function generateExerciseStub(data?: Partial<Exercise>): Exercise {
  return {
    id: data?.id
      ? data.id
      : data?.name
        ? slugify(data.name, { lower: true })
        : v4(),
    name: data?.name || generateRandomName(),
    componentIds: data?.componentIds || ['other'],
    ownerId: data?.ownerId || GLOBAL_EXERCISE_OWNER,
    isBilateral: data?.isBilateral || false,
    imageUrl: data?.imageUrl || undefined,
    videoUrl: data?.videoUrl || undefined,
    instruction: data?.instruction || '',
    attributeValues: data?.attributeValues || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };
}
