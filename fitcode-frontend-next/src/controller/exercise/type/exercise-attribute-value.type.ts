import type { IdEntity } from '@/common/type/entity.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

export type ExerciseAttributeValue = IdEntity &
  AttributeValue & {
    exerciseId: string;
    ownerId: string;
    componentIds: string[];
    isBilateral: boolean;
  };
