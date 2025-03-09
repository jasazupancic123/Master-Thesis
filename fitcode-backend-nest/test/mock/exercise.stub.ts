import { generateRandomName } from '../utils/random.util';
import { Exercise } from '../../src/exercise/entity/exercise.entity';
import { GLOBAL_EXERCISE_OWNER } from '../../src/exercise/constant/global-exercise-owner.constant';
import { BodyRegion } from '../../src/exercise/enum/body-region';
import { v4 } from 'uuid';

export function generateExerciseStub(data?: Partial<Exercise>): Exercise {
  return {
    id: v4(),
    name: data?.name || generateRandomName(),
    componentId: data?.componentId || 'other',
    tags: data?.tags || [],
    ownerId: data?.ownerId || GLOBAL_EXERCISE_OWNER,
    imageUrl: data?.imageUrl || undefined,
    videoUrl: data?.videoUrl || undefined,
    region: data?.region || BodyRegion.Core,
    equipment: data?.equipment || [],
    instruction: data?.instruction || '',
    coordination: data?.coordination || false,
    attributeValues: data?.attributeValues || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };
}
