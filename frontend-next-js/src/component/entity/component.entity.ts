import { IdEntity } from '@/common/entity/id.entity';

export type Component = IdEntity & {
  slug: string;
  parent: string | null;
  name: string;
  children: string[]; // children ids
  parents: string[]; // parent ids
}