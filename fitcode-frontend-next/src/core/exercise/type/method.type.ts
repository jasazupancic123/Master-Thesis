import type { Attribute } from '@/core/attribute/type/attribute.type';
import type { ExerciseMainParamField } from '@/core/training/type/exercise-set.type';

export type MethodAbility = Pick<
  Attribute<Record<ExerciseMainParamField | 'sets', unknown>>,
  'field' | 'min' | 'max' | 'pattern'
> & {
  disabled?: boolean;
};

export type Method = Attribute & {
  componentId: string;
  attributes: MethodAbility[];
};
