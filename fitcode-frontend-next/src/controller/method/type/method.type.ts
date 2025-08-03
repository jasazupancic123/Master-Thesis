import type { IdEntity } from '@/common/type/entity.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';

export interface Method extends IdEntity {
  name: string;
  targetId: string;
  attributes: Attribute[];
  ability: string;
  intensity: string;
  recovery: string;
  tempo?: string;
  repetition?: string;
  set?: string;
}
