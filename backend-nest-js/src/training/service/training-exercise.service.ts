import { Injectable } from '@nestjs/common';
import { TrainingExerciseRepository } from '../repository/training-exercise.repository';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingExerciseUserDataService } from './training-exercise-user-data.service';
import {
  TrainingExerciseRef,
  TrainingSupersetRef,
} from '../../common/type/firebase-firestore.type';
import { CommonService } from '../../common/service/common.service';
import {
  CreateTrainingExercise,
  UpdateTrainingExercise,
} from '../type/training-exercise.type';

@Injectable()
export class TrainingExerciseService {
  constructor(
    private readonly commonService: CommonService,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly trainingExerciseUserDataService: TrainingExerciseUserDataService,
  ) {}

  async create(
    ref: Required<TrainingSupersetRef>,
    input: CreateTrainingExercise,
  ): Promise<TrainingExercise> {
    const lastOrder = await this.trainingExerciseRepository.getLastOrder(ref);
    const data = {
      exerciseId: input.exerciseId,
      meta: input.meta,
      color: input.color || this.commonService.color.random(),
      order: lastOrder + 1,
    };

    const exerciseRef = { ...ref, exerciseId: data.exerciseId };
    await this.trainingExerciseRepository.addDoc(exerciseRef, data);

    const userData = await this.trainingExerciseUserDataService.createMany(
      exerciseRef,
      input.meta,
    );

    return { ...data, data: userData, exercise: null };
  }

  /**
   * Adds training exercises to a training component. For each exercise, it also
   * calculates user data from the exercise meta for each user in the training's
   * group.
   */
  async createMany(
    ref: Required<TrainingSupersetRef>,
    input: Pick<TrainingExercise, 'exerciseId' | 'meta' | 'color'>[],
  ) {
    const result: TrainingExercise[] = [];
    const lastOrder = await this.trainingExerciseRepository.getLastOrder(ref);

    for (let i = 0; i < input.length; i++) {
      const item = input[i];

      // create training exercise
      const data = {
        exerciseId: item.exerciseId,
        meta: item.meta,
        color: item.color || this.commonService.color.random(),
        order: lastOrder + 1 + i,
      };

      const exerciseRef = { ...ref, exerciseId: data.exerciseId };
      await this.trainingExerciseRepository.addDoc(exerciseRef, data);

      // create training exercise user data
      const userData = await this.trainingExerciseUserDataService.createMany(
        exerciseRef,
        item.meta,
      );

      result.push({ ...data, data: userData, exercise: null });
    }

    return result;
  }

  /**
   * Updates training exercise document and its user data if needed.
   */
  async update(
    ref: Required<TrainingExerciseRef>,
    input: UpdateTrainingExercise,
  ): Promise<TrainingExercise> {
    const data = {
      exerciseId: ref.exerciseId,
      color: input.color,
      meta: input.meta,
    };

    // update training exercise and user data
    const userData = await this.trainingExerciseUserDataService.updateMany(
      ref,
      input.meta,
    );

    await this.trainingExerciseRepository.updateDoc(ref, data);

    const trainingExercise = await this.trainingExerciseRepository.getDoc(ref);
    return { ...trainingExercise, data: userData };
  }
}
