import { Injectable } from '@nestjs/common';
import { TrainingComponentRepository } from '../repository/training-component.repository';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingRef } from '../../common/type/firebase-firestore.type';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { TrainingSupersetService } from './training-superset.service';

@Injectable()
export class TrainingComponentService {
  constructor(
    private readonly trainingSupersetService: TrainingSupersetService,
    private readonly trainingComponentRepository: TrainingComponentRepository,
  ) {}

  /**
   * Adds training components to training. If exercises for a training component
   * are provided, they will be added as well, as well as user data for each
   * member of the group in the training.
   */
  async createMany(
    ref: Required<TrainingRef>,
    input: Partial<TrainingComponent>[],
  ) {
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

      // create training supersets
      let supersets: TrainingSuperset[] = [];
      if (item.supersets)
        supersets = await this.trainingSupersetService.createMany(
          componentRef,
          item.supersets,
        );

      result.push({ ...data, supersets, component: null });
    }

    return result;
  }
}
