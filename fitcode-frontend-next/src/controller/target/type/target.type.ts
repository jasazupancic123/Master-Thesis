import { IdEntity } from '@/common/type/entity.type';

export interface Target extends IdEntity {
  name: string;
  componentId: string;
  color?: string;
}