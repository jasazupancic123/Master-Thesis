import { PaginateOptions } from '@/common/type/paginate.type';
import { Exercise } from '@/exercise/entity/exercise.entity';

export type FilterExerciseQuery = PaginateOptions<Exercise>
  & Partial<Pick<Exercise, 'name' | 'componentsIds' | 'attributeValues'>>
  & { ids?: string[]; }

export type CreateExercise = Pick<Exercise, 'name' | 'componentsIds' | 'imageUrl' | 'videoUrl' | 'attributeValues'>;

export type UpdateExercise = Partial<CreateExercise>;