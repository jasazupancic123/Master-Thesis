import type { Attribute } from '@/core/attribute/type/attribute.type';
import type { ExerciseMainParamField } from '@/core/training/type/exercise-set.type';

export type Component = Omit<Attribute<Record<string, unknown>>, 'options'> & {
  params?: ExerciseMainParamField[]; // exercise params fields
  attributes?: string[];
  options?: Component[];
};
