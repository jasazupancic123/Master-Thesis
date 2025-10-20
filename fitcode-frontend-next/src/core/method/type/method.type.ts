import type { IdEntity } from '@/core/entity.type';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';

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
