import type { Exercise } from '../type/exercise.type';
import { ExerciseAttributeUtil } from './exercise-attribute.util';
import { ExerciseParamUtil } from './exercise-param.util';
import { MuscleUtil } from './muscle.util';
import { lib } from '@/lib';

export class ExerciseUtil {
  readonly attribute: ExerciseAttributeUtil;
  readonly param: ExerciseParamUtil;
  readonly muscle: MuscleUtil;

  public constructor() {
    this.attribute = new ExerciseAttributeUtil();
    this.param = new ExerciseParamUtil();
    this.muscle = new MuscleUtil();
  }

  async getCachedByInstitution(
    institutionId: string
  ): Promise<Exercise[] | null> {
    const cached = await lib.common.indexedDb.items.get(
      `exercises-${institutionId}`
    );

    return cached?.payload ?? null;
  }

  async saveToCache(
    institutionId: string,
    exercises: Exercise[]
  ): Promise<void> {
    await lib.common.indexedDb.items.put({
      id: `exercises-${institutionId}`,
      payload: exercises,
      updatedAt: Date.now(),
    });
  }

  async getCachedByInstitutionExerciseRevisions(
    institutionId: string
  ): Promise<number | null> {
    const cached = await lib.common.indexedDb.items.get(
      `exercises-revision-${institutionId}`
    );

    return cached?.payload ? +cached.payload : null;
  }

  async saveInstitutionExerciseRevisionsToCache(
    institutionId: string,
    revision: number
  ): Promise<void> {
    await lib.common.indexedDb.items.put({
      id: `exercises-revision-${institutionId}`,
      payload: revision.toString(),
      updatedAt: Date.now(),
    });
  }

  async deleteCacheByInstitution(institutionId: string): Promise<void> {
    await lib.common.indexedDb.items.delete(`exercises-${institutionId}`);
    await lib.common.indexedDb.items.delete(
      `exercises-revision-${institutionId}`
    );
  }
}
