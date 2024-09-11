import { CommonService } from '@/common/service/common.service';
import { CreateExercise, FilterExerciseQuery, UpdateExercise } from '@/exercise/type/exercise.type';
import { ExerciseAttribute } from '@/exercise/entity/exercise-attribute.entity';
import { Exercise } from '@/exercise/entity/exercise.entity';

const commonService = CommonService.instance;

export class ExerciseController {
  static URL = {
    attributes: () => '/exercise/attribute',
    exercises: (filter?: FilterExerciseQuery) => {
      const query = {
        ...(filter?.ids && { ids: filter.ids.join(',') }),
        ...(filter?.name && { name: `:==:${filter.name}` }),
        ...(filter?.componentsIds && { componentsIds: `:in:${filter.componentsIds.join(',')}` }),
      };

      const paginate = {
        ...(filter?.orderBy && { orderBy: `${filter.orderBy.field}:${filter.orderBy.value}` }),
        ...(filter?.page && { page: filter.page }),
        ...(filter?.pageSize && { pageSize: filter.pageSize }),
      };

      return `/exercise${commonService.api.query({ ...query, ...paginate })}`;
    },
    exerciseById: (id: string) => `/exercise/${id}`,
  };

  static async findAttributes() {
    return await commonService.api.fetch<ExerciseAttribute[]>(this.URL.attributes());
  }

  static async findExercises(token: string, filter?: FilterExerciseQuery) {
    return await commonService.api.fetch<{ total: number, data: Exercise[] }>(this.URL.exercises(filter), { token });
  }

  static async findExercise(token: string, id: string) {
    return await commonService.api.fetch<Exercise>(this.URL.exerciseById(id), { token });
  }

  static async createExercise(token: string, body: CreateExercise) {
    return await commonService.api.fetch<{ id: string, rootComponentIds: string[] }>(this.URL.exercises(), {
      token,
      method: 'POST',
      body,
    });
  }

  static async updateExercise(token: string, id: string, body: UpdateExercise) {
    return await commonService.api.fetch<Exercise>(this.URL.exerciseById(id), { token, method: 'PATCH', body });
  }
}