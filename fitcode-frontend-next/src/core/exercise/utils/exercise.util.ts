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

  async getCached(institutionId: string): Promise<Exercise[] | null> {
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

  async getCachedInstitutionRevision(
    institutionId: string
  ): Promise<number | null> {
    const cached = await lib.common.indexedDb.items.get(
      `exercises-revision-${institutionId}`
    );

    return cached?.payload ? +cached.payload : null;
  }

  async getCachedGlobalRevision(): Promise<number | null> {
    const cached = await lib.common.indexedDb.items.get(
      `exercises-global-revision`
    );

    return cached?.payload ? +cached.payload : null;
  }

  async saveInstitutionRevisionToCache(
    institutionId: string,
    revision: number
  ): Promise<void> {
    await lib.common.indexedDb.items.put({
      id: `exercises-revision-${institutionId}`,
      payload: revision.toString(),
      updatedAt: Date.now(),
    });
  }

  async saveGlobalRevisionToCache(revision: number): Promise<void> {
    await lib.common.indexedDb.items.put({
      id: `exercises-global-revision`,
      payload: revision.toString(),
      updatedAt: Date.now(),
    });
  }
}
