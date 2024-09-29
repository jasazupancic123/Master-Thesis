import { Injectable } from '@nestjs/common';
import { TrainingSupersetRepository } from '../repository/training-superset.repository';
import {
  TrainingComponentRef,
  TrainingSupersetRef,
} from '../../common/type/firebase-firestore.type';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingExerciseService } from './training-exercise.service';
import { CommonService } from '../../common/service/common.service';
import {
  CreateTrainingSuperset,
  UpdateTrainingSuperset,
} from '../type/training-superset.type';

@Injectable()
export class TrainingSupersetService {
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingSupersetRepository: TrainingSupersetRepository,
    private readonly trainingExerciseService: TrainingExerciseService,
  ) {}

  async findAll(
    ref: Required<TrainingComponentRef>,
  ): Promise<TrainingSuperset[]> {
    return await this.trainingSupersetRepository.getDocs(ref);
  }

  async create(
    ref: Required<TrainingComponentRef>,
    input: CreateTrainingSuperset,
  ): Promise<TrainingSuperset> {
    const lastOrder = await this.trainingSupersetRepository.getLastOrder(ref);

    const data = {
      componentId: ref.componentId,
      color: input.color || this.commonService.color.random(),
      order: lastOrder + 1,
    };

    const supersetId = await this.trainingSupersetRepository.addDoc(ref, data);

    let exercises: TrainingExercise[] = [];
    if (input.exercises?.length)
      exercises = await this.trainingExerciseService.createMany(
        { ...ref, supersetId },
        input.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          membersIds: exercise.membersIds,
          meta: exercise.meta,
          color: exercise.color || data.color,
        })),
      );

    return { ...data, id: supersetId, exercises };
  }

  async createMany(
    ref: Required<TrainingComponentRef>,
    input: CreateTrainingSuperset[],
  ): Promise<TrainingSuperset[]> {
    const result: TrainingSuperset[] = [];
    const lastOrder = await this.trainingSupersetRepository.getLastOrder(ref);

    for (let i = 0; i < input.length; i++) {
      const item = input[i];

      // create training superset
      const data = {
        componentId: ref.componentId,
        color: item.color || this.commonService.color.random(),
        order: lastOrder + 1 + i,
      };

      const supersetId = await this.trainingSupersetRepository.addDoc(
        ref,
        data,
      );

      // create training exercises
      let exercises: TrainingExercise[] = [];
      if (item.exercises?.length)
        exercises = await this.trainingExerciseService.createMany(
          { ...ref, supersetId },
          item.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            membersIds: exercise.membersIds,
            meta: exercise.meta,
            color: exercise.color || data.color,
          })),
        );

      result.push({ ...data, id: supersetId, exercises });
    }

    return result;
  }

  async update(
    ref: Required<TrainingSupersetRef>,
    data: UpdateTrainingSuperset,
  ): Promise<TrainingSuperset> {
    await this.trainingSupersetRepository.updateDoc(ref, data);
    return {
      id: ref.supersetId,
      componentId: ref.componentId,
      color: data.color,
      exercises: [],
      order: data.order,
    };
  }

  async remove(ref: Required<TrainingSupersetRef>): Promise<void> {
    const exercises = await this.trainingExerciseService.findAll(ref);
    for (const { exerciseId } of exercises)
      await this.trainingExerciseService.remove({ ...ref, exerciseId });

    await this.trainingSupersetRepository.deleteDoc(ref);
  }
}
