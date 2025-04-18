import { IdEntity } from '@/common/type/entity.type';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

export type ExerciseAttributeValue = IdEntity &
  AttributeValue & {
    exerciseId: string;
    ownerId: string;
    componentIds: string[];
  };
