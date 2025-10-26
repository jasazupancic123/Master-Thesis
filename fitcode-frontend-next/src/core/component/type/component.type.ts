import type { IdEntity } from '@/core/entity.type';
import type { Target } from '@/core/target/type/target.type';
import type { ExerciseMainParamField } from '@/core/training/type/exercise-set.type';

export type Component = IdEntity & {
  slug: string;
  name: string;
  parentId: string | null;
  attributes?: string[];
  targets?: Target[]; // target, only root components have them
  params?: ExerciseMainParamField[]; // only root components have params
  children: string[]; // children ids
  parents: string[]; // parent ids
};

export type TreeComponent = Omit<Component, 'children'> & {
  children: TreeComponent[];
};
