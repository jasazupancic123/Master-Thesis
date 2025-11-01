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
    ownerId: data?.ownerId || GLOBAL_EXERCISE_OWNER,
    disabled: data?.disabled || false,
    imageUrl: data?.imageUrl || undefined,
    videoUrl: data?.videoUrl || undefined,
    instruction: data?.instruction || '',
    isUnilateral: data?.isUnilateral || false,
    params: data?.params || [],
    components: data?.components || ['other'],
    muscleValues: data?.muscleValues || [],
    equipment: data?.equipment || [],
    prescriptions: data?.prescriptions || [],
    patterns: data?.patterns || [],
    bodyRegions: data?.bodyRegions || [],
    loadingSides: data?.loadingSides || [],
    locations: data?.locations || [],
    liftPriorities: data?.liftPriorities || [],
    movementDirections: data?.movementDirections || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };
}
