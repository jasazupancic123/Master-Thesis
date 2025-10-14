import type { IdEntity } from '@/common/type/entity.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';

export interface Method extends IdEntity {
  name: string;
  componentId: string;
  attributes: Attribute<ExerciseSet>[];
  ability: string;
  intensity: string;
  recovery: string;
  tempo?: string;
  repetition?: string;
  set?: string;
}
