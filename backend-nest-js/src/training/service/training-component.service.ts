import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { TrainingComponentRepository } from '../repository/training-component.repository';
import { TrainingComponent } from '../entity/training-component.entity';
import {
  TrainingComponentRef,
  TrainingRef,
} from '../../common/type/firebase-firestore.type';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { TrainingSupersetService } from './training-superset.service';
import { CommonService } from '../../common/service/common.service';
import {
  CreateTrainingComponent,
  UpdateTrainingComponent,
} from '../type/training-component.type';
import { ComponentService } from '../../component/component.service';
import { Component } from '../../component/entity/component.entity';
import { User } from '../../common/type/firebase-auth.type';
import { TrainingService } from './training.service';
import { Training } from '../entity/training.entity';
import { Wrapper } from '../../common/type/wrapper.type';

@Injectable()
export class TrainingComponentService {
  private readonly logger = new Logger(TrainingComponentService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly componentService: ComponentService,
    private readonly trainingSupersetService: TrainingSupersetService,
    private readonly trainingComponentRepository: TrainingComponentRepository,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
  ) {}

  async findOne(
    ref: Required<TrainingComponentRef>,
    options?: { user?: User },
  ): Promise<TrainingComponent> {
    let training: Training;
    if (options?.user)
      training = await this.trainingService.findOneOrFail(ref, options);

    const component = await this.trainingComponentRepository.getDoc(ref);
    if (!component) return null;
    component.training = training;

    const supersets = await this.trainingSupersetService.findAll(ref);
    return { ...component, supersets };
  }

  async findOneOrFail(
    ref: Required<TrainingComponentRef>,
    options?: { user?: User },
  ): Promise<TrainingComponent> {
    const component = await this.findOne(ref, options);
    if (!component)
      throw new BadRequestException('Training component not found');

    return component;
  }

  /**
   * Adds training components to training. If exercises for a training component
   * are provided, they will be added as well, as well as user data for each
   * member of the group in the training.
   */
  async createMany(
    ref: Required<TrainingRef>,
    input: CreateTrainingComponent[],
    options: { user: User },
  ): Promise<TrainingComponent[]> {
    const training = await this.trainingService.findOneOrFail(ref, {
      user: options.user,
      populate: ['components'],
    });

    // make sure all components exist
    const componentIds = input.map((item) => item.componentId);
    const components = await this.componentService.findAllFlat({
      filter: { ids: componentIds },
    });

    // training components must be unique
    const duplicates: Component[] = [];
    for (const component of components) {
      const exists = training.components.find(
        (c) => c.componentId === component.id,
      );

      if (exists) duplicates.push(component);
    }

    if (duplicates.length)
      throw new BadRequestException(
        `Components ${duplicates.map((c) => c.name.toLowerCase()).join(', ')} already exist in the training`,
      );

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
          options,
        );

      result.push({
        ...data,
        trainingId: training.id,
        supersets,
        component: null,
      });
    }

    return result;
  }

  async update(
    ref: Required<TrainingComponentRef>,
    input: UpdateTrainingComponent,
    options?: { user?: User },
  ): Promise<TrainingComponent> {
    await this.findOneOrFail(ref, options);
    await this.trainingComponentRepository.updateDoc(ref, input);

    return {
      componentId: ref.componentId,
      trainingId: ref.trainingId,
      color: input.color,
      order: input.order,
      supersets: [],
    };
  }

  async remove(
    ref: Required<TrainingComponentRef>,
    options: { user: User },
  ): Promise<void> {
    this.logger.debug(
      `Removing training component ${ref.componentId} (user ${options.user.uid})`,
    );

    await this.trainingService.findOneOrFail(ref, options);

    const supersets = await this.trainingSupersetService.findAll(ref);
    for (const { id: supersetId } of supersets)
      await this.trainingSupersetService.remove(
        { ...ref, supersetId },
        options,
      );

    await this.trainingComponentRepository.deleteDoc(ref);
  }
}
