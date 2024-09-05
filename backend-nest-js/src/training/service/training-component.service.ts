import { Injectable } from '@nestjs/common';
import { TrainingComponentRepository } from '../repository/training-component.repository';
import { TrainingExerciseService } from './training-exercise.service';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingRef } from '../../common/type/firebase-firestore.type';

@Injectable()
export class TrainingComponentService {
  constructor(
    private readonly trainingExerciseService: TrainingExerciseService,
    private readonly trainingComponentRepository: TrainingComponentRepository,
  ) {
  }

  /**
   * Adds training components to training. If exercises for a training component
   * are provided, they will be added as well, as well as user data for each
   * member of the group in the training.
   */
  async createMany(ref: Required<TrainingRef>, input: Partial<TrainingComponent>[]) {
    const result: TrainingComponent[] = [];

    for (let order = 0; order < input.length; order++) {
      const item = input[order];

      // create training component
      const data = {
        componentId: item.componentId,
        order: item.order || order,
        color: item.color,
      };

      const componentRef = { ...ref, componentId: data.componentId };
      await this.trainingComponentRepository.addDoc(componentRef, data);

      // create training exercises
      let exercises: TrainingExercise[] = [];
      if (item.exercises)
        exercises = await this.trainingExerciseService.createMany(componentRef, item.exercises);

      result.push({ ...data, exercises, component: null });
    }

    return result;
  }
}