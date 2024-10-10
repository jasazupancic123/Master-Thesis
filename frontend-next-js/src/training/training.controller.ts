import { CommonService } from '@/common/service/common.service';
import { CreateTraining, FilterTrainingQuery, UpdateTraining } from '@/training/type/training.type';
import dayjs from 'dayjs';
import { Training } from '@/training/entity/training.entity';
import { CreateTrainingComponent, UpdateTrainingComponent } from '@/training/type/training-component.type';
import { TrainingComponent } from '@/training/entity/training-component.entity';
import { CreateTrainingSuperset, UpdateTrainingSuperset } from '@/training/type/training-superset.type';
import { TrainingSuperset } from '@/training/entity/training-superset.entity';
import { CreateTrainingExercise, UpdateTrainingExercise } from '@/training/type/training-exercise.type';
import { TrainingExercise } from '@/training/entity/training-exercise.entity';

const commonService = CommonService.instance;

export class TrainingController {
  static URL = {
    trainings: (filter?: FilterTrainingQuery) => {
      const query = {
        ...(filter?.groupId && { groupId: filter.groupId }),
        ...(filter?.cycleId && { cycleId: filter.cycleId }),
        ...(filter?.subgroupId && { subgroupId: filter.subgroupId }),
        ...(filter?.from && { from: dayjs(filter.from).toISOString() }),
        ...(filter?.to && { to: dayjs(filter.to).toISOString() }),
      };

      return `/training${commonService.api.query(query)}`;
    },
    trainingsByIds: () => `/training/ids`,
    trainingById: (trainingId: string) => `/training/${trainingId}`,
    trainingComponents: (trainingId: string) => `/training/${trainingId}/component`,
    trainingComponentById: (trainingId: string, componentId: string) => `/training/${trainingId}/component/${componentId}`,
    trainingSupersets: (trainingId: string, componentId: string) => `/training/${trainingId}/component/${componentId}/superset`,
    trainingSupersetById: (trainingId: string, componentId: string, supersetId: string) => `/training/${trainingId}/component/${componentId}/superset/${supersetId}`,
    trainingExercises: (trainingId: string, componentId: string, supersetId: string) => `/training/${trainingId}/component/${componentId}/superset/${supersetId}/exercise`,
    trainingExerciseById: (trainingId: string, componentId: string, supersetId: string, exerciseId: string) => `/training/${trainingId}/component/${componentId}/superset/${supersetId}/exercise/${exerciseId}`,
  };


  static async findTrainings(token: string, filter?: FilterTrainingQuery) {
    return await commonService.api.fetch<Training[]>(this.URL.trainings(filter), { token });
  }

  static async findTrainingsByIds(token: string, ids: string[]) {
    return await commonService.api.fetch<Training[]>(this.URL.trainingsByIds(), {
      token,
      method: 'POST',
      body: { ids },
    });
  }

  static async addTraining(token: string, input: CreateTraining) {
    const body = {
      groupId: input.groupId,
      cycleId: input.cycleId,
      subgroupId: input.subgroupId || null,
      from: dayjs(input.from).toISOString(),
      to: dayjs(input.to).toISOString(),
      componentIds: input.componentIds,
    };

    return await commonService.api.fetch<Training>(this.URL.trainings(), {
      token,
      method: 'POST',
      body,
    });
  }

  static async updateTraining(token: string, trainingId: string, body: UpdateTraining) {
    return await commonService.api.fetch<Training>(this.URL.trainingById(trainingId), {
      token,
      method: 'PATCH',
      body: {
        ...(body.from && { from: dayjs(body.from).toISOString() }),
        ...(body.to && { to: dayjs(body.to).toISOString() }),
      },
    });
  }

  static async deleteTraining(token: string, trainingId: string) {
    return await commonService.api.fetch<Training>(this.URL.trainingById(trainingId), {
      token,
      method: 'DELETE',
    });
  }

  static async addTrainingComponents(token: string, trainingId: string, input: CreateTrainingComponent[]) {
    return await commonService.api.fetch<TrainingComponent[]>(this.URL.trainingComponents(trainingId), {
      token,
      method: 'POST',
      body: {
        components: input,
      },
    });
  }

  static async updateTrainingComponent(token: string, trainingId: string, componentId: string, body: UpdateTrainingComponent) {
    return await commonService.api.fetch<TrainingComponent>(this.URL.trainingComponentById(trainingId, componentId), {
      token,
      method: 'PATCH',
      body,
    });
  }

  static async deleteTrainingComponent(token: string, trainingId: string, componentId: string) {
    return await commonService.api.fetch<TrainingComponent>(this.URL.trainingComponentById(trainingId, componentId), {
      token,
      method: 'DELETE',
    });
  }

  static async addSuperset(token: string, trainingId: string, componentId: string, body: CreateTrainingSuperset) {
    return await commonService.api.fetch<TrainingSuperset>(this.URL.trainingSupersets(trainingId, componentId), {
      token,
      method: 'POST',
      body,
    });
  }

  static async updateSuperset(token: string, trainingId: string, componentId: string, supersetId: string, body: UpdateTrainingSuperset) {
    return await commonService.api.fetch<TrainingSuperset>(this.URL.trainingSupersets(trainingId, componentId), {
      token,
      method: 'PATCH',
      body,
    });
  }

  static async deleteSuperset(token: string, trainingId: string, componentId: string, supersetId: string) {
    return await commonService.api.fetch<{
      id: string
    }>(this.URL.trainingSupersetById(trainingId, componentId, supersetId), {
      token,
      method: 'DELETE',
    });
  }

  static async addTrainingExercises(token: string, trainingId: string, componentId: string, supersetId: string, input: CreateTrainingExercise[]) {
    return await commonService.api.fetch<TrainingExercise[]>(this.URL.trainingExercises(trainingId, componentId, supersetId), {
      token,
      method: 'POST',
      body: {
        exercises: input,
      },
    });
  }

  static async updateExercise(token: string, trainingId: string, componentId: string, supersetId: string, exerciseId: string, body: UpdateTrainingExercise) {
    return await commonService.api.fetch<TrainingExercise>(this.URL.trainingExerciseById(trainingId, componentId, supersetId, exerciseId), {
      token,
      method: 'PATCH',
      body,
    });
  }

  static async deleteExercise(token: string, trainingId: string, componentId: string, supersetId: string, exerciseId: string) {
    return await commonService.api.fetch<{
      id: string
    }>(this.URL.trainingExerciseById(trainingId, componentId, supersetId, exerciseId), {
      token,
      method: 'DELETE',
    });
  }
}