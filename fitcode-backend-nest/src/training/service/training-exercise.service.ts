import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
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
import { TrainingService } from './training.service';
import { User } from '../../common/type/firebase-auth.type';
import { TrainingSupersetService } from './training-superset.service';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { Wrapper } from '../../common/type/wrapper.type';

@Injectable()
export class TrainingExerciseService {
  private logger = new Logger(TrainingExerciseService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly exerciseService: ExerciseService,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly trainingExerciseUserDataService: TrainingExerciseUserDataService,
    @Inject(forwardRef(() => TrainingSupersetService))
    private readonly trainingSupersetService: Wrapper<TrainingSupersetService>,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
  ) {}

  async findOne(
    ref: Required<TrainingExerciseRef>,
    options: { user: User },
  ): Promise<TrainingExercise> {
    const superset = await this.trainingSupersetService.findOneOrFail(
      ref,
      options,
    );

    const trainingExercise = await this.trainingExerciseRepository.getDoc(ref);
    if (!trainingExercise) return null;
    trainingExercise.superset = superset;

    const userData = await this.trainingExerciseUserDataService.findAll(ref);
    return { ...trainingExercise, data: userData };
  }

  async findOneOrFail(
    ref: Required<TrainingExerciseRef>,
    options: { user: User },
  ): Promise<TrainingExercise> {
    const trainingExercise = await this.findOne(ref, options);
    if (!trainingExercise)
      throw new BadRequestException('Training exercise not found');

    return trainingExercise;
  }

  async findAll(
    ref: Required<TrainingSupersetRef>,
  ): Promise<TrainingExercise[]> {
    return await this.trainingExerciseRepository.getDocs(ref);
  }

  /**
   * Adds training exercises to a training component. For each exercise, it also
   * calculates user data from the exercise meta for each user in the training's
   * group.
   */
  async createMany(
    ref: Required<TrainingSupersetRef>,
    input: CreateTrainingExercise[],
    options: { user: User },
  ) {
    await this.trainingSupersetService.findOneOrFail(ref, options);

    this.logger.debug(
      `Creating training exercises for superset ${ref.supersetId}: ${JSON.stringify(input)}`,
    );

    // find all exercises
    const exerciseIds = input.map((e) => e.exerciseId);
    const exercises = await this.exerciseService.findAll(options.user, {
      filter: { ids: exerciseIds },
    });

    if (exercises.length !== exerciseIds.length)
      throw new BadRequestException('Some exercises do not exist');

    // validate exercises
    const { error, message } = await this.exerciseService.validateExercises(
      ref.componentId,
      exercises,
    );

    if (error) throw new BadRequestException(message);

    const result: TrainingExercise[] = [];
    const lastOrder = await this.trainingExerciseRepository.getLastOrder(ref);

    for (let i = 0; i < input.length; i++) {
      const item = input[i];

      // create training exercise
      const data = {
        exerciseId: item.exerciseId,
        membersIds:
          item.membersIds ||
          (await this.trainingService.findOneOrFail(ref)).membersIds,
        meta: item.meta,
        color: item.color || this.commonService.color.random(),
        order: lastOrder + 1 + i,
      };

      const exerciseRef = { ...ref, exerciseId: data.exerciseId };
      await this.trainingExerciseRepository.addDoc(exerciseRef, data);

      // create training exercise user data
      const userData = await this.trainingExerciseUserDataService.createMany(
        exerciseRef,
        data,
      );

      result.push({
        ...data,
        data: userData,
        exercise: exercises.find((e) => e.id === data.exerciseId),
      });
    }

    return result;
  }

  /**
   * Updates training exercise document and its user data if needed.
   */
  async update(
    ref: Required<TrainingExerciseRef>,
    input: UpdateTrainingExercise,
    options: { user: User },
  ): Promise<TrainingExercise> {
    const trainingExercise = await this.findOneOrFail(ref, options);

    this.logger.debug(
      `Updating training exercise ${JSON.stringify(ref)} with ${JSON.stringify(input)}`,
    );

    // find exercise
    const exerciseRef = { exerciseId: trainingExercise.exerciseId };
    const exercise = await this.exerciseService.findOneOrFail(exerciseRef, {
      userId: options.user.uid,
    });

    // validate exercise
    const { error, message } = await this.exerciseService.validateExercises(
      ref.componentId,
      [exercise],
    );

    if (error) throw new BadRequestException(message);

    // update training exercise and user data
    const userData = await this.trainingExerciseUserDataService.updateMany(
      ref,
      input.meta,
    );

    await this.trainingExerciseRepository.updateDoc(ref, {
      exerciseId: ref.exerciseId,
      color: input.color,
      order: input.order,
      meta: input.meta,
    });

    return { ...trainingExercise, ...input, data: userData };
  }

  async remove(
    ref: Required<TrainingExerciseRef>,
    options: { user: User },
  ): Promise<void> {
    this.logger.debug(`Removing training exercise ${JSON.stringify(ref)}`);
    await this.findOneOrFail(ref, options);
    await this.trainingExerciseUserDataService.removeAll(ref);
    await this.trainingExerciseRepository.deleteDoc(ref);
  }
}
