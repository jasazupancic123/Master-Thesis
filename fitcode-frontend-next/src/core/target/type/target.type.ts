import type { IdEntity } from '@/core/entity.type';

export interface Target extends IdEntity {
  name: string;
  componentId: string;
  color?: string;
}
