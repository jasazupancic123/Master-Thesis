import { Injectable } from '@nestjs/common';
import { TrainingSupersetRepository } from '../repository/training-superset.repository';
import { TrainingComponentRef } from '../../common/type/firebase-firestore.type';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingExerciseService } from './training-exercise.service';

@Injectable()
export class TrainingSupersetService {
  constructor(
    private readonly trainingSupersetRepository: TrainingSupersetRepository,
    private readonly trainingExerciseService: TrainingExerciseService,
  ) {}

  async createMany(
    ref: Required<TrainingComponentRef>,
    input: Partial<Omit<TrainingSuperset, 'id' | 'componentId'>[]>,
  ) {
    const result: TrainingSuperset[] = [];

    for (let i = 0; i < input.length; i++) {
      const item = input[i];

      // create training superset
      const data = {
        componentId: ref.componentId,
        order: item.order,
        color: item.color,
      };

      const supersetId = await this.trainingSupersetRepository.addDoc(
        ref,
        data,
      );

      // create training exercises
      let exercises: TrainingExercise[] = [];
      if (item.exercises)
        exercises = await this.trainingExerciseService.createMany(
          { ...ref, supersetId },
          item.exercises.map((exercise, i) => ({
            ...exercise,
            order: i,
          })),
        );

      result.push({ ...data, id: supersetId, exercises });
    }

    return result;
  }
}
