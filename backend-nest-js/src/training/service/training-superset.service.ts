import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
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
import { User } from '../../common/type/firebase-auth.type';
import { TrainingComponentService } from './training-component.service';
import { TrainingComponent } from '../entity/training-component.entity';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { Wrapper } from '../../common/type/wrapper.type';

@Injectable()
export class TrainingSupersetService {
  private logger = new Logger(TrainingSupersetService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly exerciseService: ExerciseService,
    private readonly trainingSupersetRepository: TrainingSupersetRepository,
    private readonly trainingExerciseService: TrainingExerciseService,
    @Inject(forwardRef(() => TrainingComponentService))
    private readonly trainingComponentService: Wrapper<TrainingComponentService>,
  ) {}

  async findOne(
    ref: Required<TrainingSupersetRef>,
    options?: { user?: User },
  ): Promise<TrainingSuperset> {
    let component: TrainingComponent;
    if (options?.user)
      component = await this.trainingComponentService.findOneOrFail(
        ref,
        options,
      );

    const superset = await this.trainingSupersetRepository.getDoc(ref);
    if (!superset) return null;
    superset.component = component;

    const exercises = await this.trainingExerciseService.findAll(ref);
    return { ...superset, exercises };
  }

  async findOneOrFail(
    ref: Required<TrainingSupersetRef>,
    options?: { user?: User },
  ): Promise<TrainingSuperset> {
    const superset = await this.findOne(ref, options);
    if (!superset) throw new BadRequestException('Training superset not found');
    return superset;
  }

  async findAll(
    ref: Required<TrainingComponentRef>,
  ): Promise<TrainingSuperset[]> {
    return await this.trainingSupersetRepository.getDocs(ref);
  }

  async create(
    ref: Required<TrainingComponentRef>,
    input: CreateTrainingSuperset,
    options: { user: User },
  ): Promise<TrainingSuperset> {
    // validate component
    await this.trainingComponentService.findOneOrFail(ref, options);

    this.logger.debug(
      `Creating training superset for component ${ref.componentId}: ${JSON.stringify(input)}`,
    );

    await this.validateExercises(
      options.user,
      ref.componentId,
      input.exercises.map((e) => e.exerciseId),
    );

    const lastOrder = await this.trainingSupersetRepository.getLastOrder(ref);
    const supersetId = await this.trainingSupersetRepository.addDoc(ref, {
      componentId: ref.componentId,
      color: input.color || this.commonService.color.random(),
      order: lastOrder + 1,
    });

    const superset = await this.trainingSupersetRepository.getDoc({
      ...ref,
      supersetId,
    });

    let exercises: TrainingExercise[] = [];
    if (input.exercises?.length)
      exercises = await this.trainingExerciseService.createMany(
        { ...ref, supersetId },
        input.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          membersIds: exercise.membersIds,
          meta: exercise.meta,
          color: exercise.color || superset.color,
        })),
        options,
      );

    return { ...superset, exercises };
  }

  async createMany(
    ref: Required<TrainingComponentRef>,
    input: CreateTrainingSuperset[],
    options: { user: User },
  ): Promise<TrainingSuperset[]> {
    await this.trainingComponentService.findOneOrFail(ref, options);
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
          options,
        );

      result.push({ ...data, id: supersetId, exercises });
    }

    return result;
  }

  async update(
    ref: Required<TrainingSupersetRef>,
    data: UpdateTrainingSuperset,
    options?: { user?: User },
  ): Promise<TrainingSuperset> {
    await this.trainingComponentService.findOneOrFail(ref, options);
    await this.trainingSupersetRepository.updateDoc(ref, data);
    return {
      id: ref.supersetId,
      componentId: ref.componentId,
      color: data.color,
      exercises: [],
      order: data.order,
    };
  }

  async remove(
    ref: Required<TrainingSupersetRef>,
    options: { user: User },
  ): Promise<void> {
    await this.trainingComponentService.findOneOrFail(ref, options);

    this.logger.debug(`Removing training superset ${ref.supersetId}`);

    const exercises = await this.trainingExerciseService.findAll(ref);
    for (const { exerciseId } of exercises)
      await this.trainingExerciseService.remove(
        { ...ref, exerciseId },
        options,
      );

    await this.trainingSupersetRepository.deleteDoc(ref);
  }

  private async validateExercises(
    user: User,
    componentId: string,
    exerciseIds: string[],
  ): Promise<void> {
    if (!exerciseIds.length) return;

    const exercises = await this.exerciseService.findAll(user, {
      filter: { ids: exerciseIds },
    });

    const { error, message } = await this.exerciseService.validateExercises(
      componentId,
      exercises,
    );

    if (error) throw new BadRequestException(message);
  }
}
