import { Injectable } from '@nestjs/common';
import { TrainingComponentRepository } from '../repository/training-component.repository';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingRef } from '../../common/type/firebase-firestore.type';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { TrainingSupersetService } from './training-superset.service';
import { CommonService } from '../../common/service/common.service';
import { CreateTrainingComponent } from '../type/training-component.type';

@Injectable()
export class TrainingComponentService {
  constructor(
    private readonly commonService: CommonService,
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
    input: CreateTrainingComponent[],
  ): Promise<TrainingComponent[]> {
    const result: TrainingComponent[] = [];
    const lastOrder = await this.trainingComponentRepository.getLastOrder(ref);

    for (let i = 0; i < input.length; i++) {
      const item = input[i];

      // create training component
      const data = {
        componentId: item.componentId,
        color: item.color || this.commonService.color.random(),
        order: lastOrder + 1 + i,
      };

      const componentRef = { ...ref, componentId: data.componentId };
      await this.trainingComponentRepository.addDoc(componentRef, data);

      // create training supersets
      let supersets: TrainingSuperset[] = [];
      if (item.supersets?.length)
        supersets = await this.trainingSupersetService.createMany(
          componentRef,
          item.supersets.map((superset) => ({
            color: superset.color || data.color,
            exercises: superset.exercises,
          })),
        );

      result.push({ ...data, supersets, component: null });
    }

    return result;
  }
}
