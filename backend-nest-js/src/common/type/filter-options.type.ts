import { BaseEntity } from '../entity/base.entity';

export type FilterOptions<T extends BaseEntity> = {
  field: keyof T;
  returnArray: boolean;
}

export type Filter<T extends BaseEntity> = {
  field: keyof T;
  value: string;
}