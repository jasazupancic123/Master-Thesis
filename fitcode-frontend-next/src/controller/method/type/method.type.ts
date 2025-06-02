import { IdEntity } from '@/common/type/entity.type';

export interface Method extends IdEntity {
  name: string;
  targetId: string;
  ability: string;
  repetition: string;
  intensity: string;
  recovery: string;
  set?: string;
  tempo?: string;
}
