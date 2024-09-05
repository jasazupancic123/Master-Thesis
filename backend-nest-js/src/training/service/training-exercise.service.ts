import { Injectable } from '@nestjs/common';
import { TrainingExerciseRepository } from '../repository/training-exercise.repository';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingExerciseUserDataService } from './training-exercise-user-data.service';
import { TrainingComponentRef, TrainingExerciseRef } from '../../common/type/firebase-firestore.type';

@Injectable()
export class TrainingExerciseService {
  constructor(
    private readonly trainingExerciseUserDataService: TrainingExerciseUserDataService,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
  ) {
  }

  /**
   * Adds training exercises to a training component. For each exercise, it also
   * calculates user data from the exercise meta for each user in the training's
   * group.
   */
  async createMany(ref: Required<TrainingComponentRef>, input: Partial<TrainingExercise>[]) {
    const result: TrainingExercise[] = [];

    for (let order = 0; order < input.length; order++) {
      const item = input[order];

      // create training exercise
      const data = {
        exerciseId: item.exerciseId,
        order: item.order || order,
        color: item.color,
        meta: item.meta,
      };

      const exerciseRef = { ...ref, exerciseId: data.exerciseId };
      await this.trainingExerciseRepository.addDoc(exerciseRef, data);

      // create training exercise user data
      const trainingExercise = await this.trainingExerciseRepository.getDoc(exerciseRef);
      const userData = await this.trainingExerciseUserDataService.createMany(exerciseRef, trainingExercise.meta);

      result.push({ ...data, data: userData, exercise: null });
    }

    return result;
  }

  /**
   * Updates training exercise document and its user data if needed.
   */
  async update(
    ref: Required<TrainingExerciseRef>,
    input: Partial<TrainingExercise>,
  ): Promise<TrainingExercise> {
    const data = {
      exerciseId: ref.exerciseId,
      order: input.order,
      color: input.color,
      meta: input.meta,
    };

    // update training exercise and user data
    await this.trainingExerciseRepository.updateDoc(ref, data);
    const userData = await this.trainingExerciseUserDataService.updateMany(ref, input.meta);

    return { ...data, data: userData, exercise: null };
  }
}