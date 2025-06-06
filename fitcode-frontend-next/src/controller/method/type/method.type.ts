import { IdEntity } from '@/common/type/entity.type';
import { AttributeRange } from '@/controller/attribute/type/attribute-range.entity';

export interface Method extends IdEntity {
  name: string;
  targetId: string;
  attributeRanges: AttributeRange[];
  ability: string;
  intensity: string;
  recovery: string;
  tempo?: string;
  repetition?: string;
  set?: string;
}
