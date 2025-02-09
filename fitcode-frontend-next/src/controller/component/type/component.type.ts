import { IdEntity } from '@/common/type/entity.type';

export type Component = IdEntity & {
  slug: string;
  parent: string | null;
  name: string;
  children: string[]; // children ids
  parents: string[]; // parent ids
};

export type TreeComponent = Omit<Component, 'children'> & {
  children: TreeComponent[];
};
