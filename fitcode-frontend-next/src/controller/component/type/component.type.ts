import { IdEntity } from '@/common/type/entity.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { Target } from '@/controller/target/type/target.type';

export type Component = IdEntity & {
  slug: string;
  name: string;
  parentId: string | null;
  attributes?: string[];
  targets?: Target[]; // target, only root components have them
  params?: { [condition: string]: ComponentParam[] }; // only root components have params
  children: string[]; // children ids
  parents: string[]; // parent ids
};

export type TreeComponent = Omit<Component, 'children'> & {
  children: TreeComponent[];
};

export type ComponentParam = Pick<Attribute, 'field' | 'defaultValue'> & {
  options?: ComponentParam[];
};
