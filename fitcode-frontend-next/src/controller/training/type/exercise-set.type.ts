import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

export interface ExerciseSet {
  setNumber: number;
  paramValuesL: AttributeValue[];
  paramValuesR: AttributeValue[];
}
