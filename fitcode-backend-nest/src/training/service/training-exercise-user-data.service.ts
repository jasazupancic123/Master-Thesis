import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { TrainingExerciseUserDataRepository } from '../repository/training-exercise-user-data.repository';
import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';
import { TrainingExerciseRepository } from '../repository/training-exercise.repository';
import { FirebaseService } from '../../firebase/firebase.service';
import {
  ExerciseSetData,
  TrainingExerciseUserData,
} from '../entity/training-exercise-user-data.entity';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';
import {
  TrainingExerciseRef,
  TrainingExerciseUserDataRef,
  TrainingRef,
} from '../../common/type/firebase-firestore.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CreateTrainingExerciseUserData,
  UpdateTrainingExerciseUserData,
} from '../type/training-exercise-user-data.type';
import { User } from '../../common/type/firebase-auth.type';
import { TrainingService } from './training.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { UserService } from '../../user/service/user.service';
import { SetStatus } from '../enum/set-status.enum';

@Injectable()
export class TrainingExerciseUserDataService {
  private logger = new Logger(TrainingExerciseUserDataService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly trainingExerciseUserDataRepository: TrainingExerciseUserDataRepository,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
  ) {}

  /**
   * Gets all training exercise user data for all trainings for all users by
   * provided exercise id.
   */
  async findAll(ref: Required<TrainingExerciseRef>) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_EXERCISE_USER_DATA)
      .where('exerciseId', '==', ref.exerciseId)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.trainingExerciseUserDataRepository.serialize(doc),
        ),
      );
  }

  /**
   * Creates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  async createMany(
    ref: Required<TrainingExerciseRef>,
    input: CreateTrainingExerciseUserData,
  ): Promise<TrainingExerciseUserData[]> {
    const result: TrainingExerciseUserData[] = [];

    // find all members for the provided group (or subgroup if provided)
    const { membersIds } = input;
    const members = await this.firebaseService.authUsers({ ids: membersIds });

    // get data for all users
    const allUsersData = (await this.findAll(ref)) || [];

    // for each member, calculate individual values for exercise user data
    const batch = this.firebaseService.firestore.batch();
    for (const member of members) {
      const bodyweight = await this.userService.getBodyweight(member.uid);
      const userData = allUsersData.filter(
        (item) => item.userId === member.uid,
      );

      const workloadValue = this.calculateWorkloadValue(
        input.meta.workloadType,
        input.meta.workloadValue,
        bodyweight,
        userData.map((data) => data.sets).flat(),
      );

      const data: TrainingExerciseUserData = {
        userId: member.uid,
        trainingId: ref.trainingId,
        componentId: ref.componentId,
        supersetId: ref.supersetId,
        exerciseId: ref.exerciseId,
        workloadValue,
        sets: Array.from({ length: input.meta.sets }).map((_, set) => ({
          status: SetStatus.NOT_STARTED,
          setNumber: set + 1,
          setTypeValue: null,
          workloadValue: null,
        })),
      };

      const docRef = this.trainingExerciseUserDataRepository.doc({
        ...ref,
        userId: member.uid,
      });

      batch.set(docRef, data);
      result.push(data);
    }

    await batch.commit();
    return result;
  }

  /**
   * Create training exercise user data for a single user.
   */
  async create(
    ref: Required<TrainingExerciseRef>,
    userId: string,
    input: TrainingExerciseMeta,
  ): Promise<TrainingExerciseUserData> {
    const bodyweight = await this.userService.getBodyweight(userId);
    const userData = await this.trainingExerciseUserDataRepository.getDoc({
      ...ref,
      userId,
    });

    const workloadValue = this.calculateWorkloadValue(
      input.workloadType,
      input.workloadValue,
      bodyweight,
      userData ? userData.sets : [],
    );

    const data: TrainingExerciseUserData = {
      userId,
      trainingId: ref.trainingId,
      componentId: ref.componentId,
      supersetId: ref.supersetId,
      exerciseId: ref.exerciseId,
      workloadValue,
      sets: Array.from({ length: input.sets }).map((_, set) => ({
        status: SetStatus.NOT_STARTED,
        setNumber: set + 1,
        setTypeValue: null,
        workloadValue: null,
      })),
    };

    const docRef = this.trainingExerciseUserDataRepository.doc({
      ...ref,
      userId,
    });

    await docRef.set(data);
    return data;
  }

  /**
   * Creates exercise user data for specified user for all exercises in the
   * provided training.
   */
  async createByTraining(
    ref: Required<TrainingRef>,
    input: { memberId: string },
    options: { user: User },
  ) {
    this.logger.debug(
      `Creating training exercise user data ${JSON.stringify(ref)} for user ${input.memberId}`,
    );

    // find all trainings
    const training = await this.trainingService.findOneOrFail(ref, {
      user: options.user,
      populate: [
        'components',
        'components.supersets',
        'components.supersets.exercises',
      ],
    });

    await Promise.all(
      training.components.map((component) => {
        component.supersets.map((superset) => {
          superset.exercises.map((exercise) => {
            const exerciseRef = {
              trainingId: training.id,
              componentId: component.componentId,
              supersetId: superset.id,
              exerciseId: exercise.exerciseId,
            };

            // create training exercise user data
            this.create(exerciseRef, input.memberId, exercise.meta);
          });
        });
      }),
    );
  }

  /**
   * Updates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and updates them in the
   * correct training component exercise user data document.
   */
  async updateMany(
    ref: Required<TrainingExerciseRef>,
    input: UpdateTrainingExerciseUserData,
  ): Promise<TrainingExerciseUserData[]> {
    const result: TrainingExerciseUserData[] = [];

    // find all members
    const members = (
      await this.trainingExerciseUserDataRepository.getDocs(ref, (collection) =>
        collection
          .where('trainingId', '==', ref.trainingId)
          .where('componentId', '==', ref.componentId)
          .where('supersetId', '==', ref.supersetId)
          .where('exerciseId', '==', ref.exerciseId),
      )
    ).map((item) => item.userId);

    // get data for all users
    const allUsersData = await this.findAll(ref);
    const { meta } = await this.trainingExerciseRepository.getDoc(ref); // old meta

    // if nothing changed, return
    const isWorkloadTypeChanged =
      input.workloadType && meta.workloadType !== meta.workloadType;
    const isWorkloadValueChanged =
      input.workloadValue && meta.workloadValue !== meta.workloadValue;
    if (!isWorkloadTypeChanged && !isWorkloadValueChanged) return;

    // for each member, calculate individual values for exercise user data
    const batch = this.firebaseService.firestore.batch();
    for (const member of members) {
      const bodyweight = await this.userService.getBodyweight(member);
      const userData = allUsersData.filter((item) => item.userId === member);

      const workloadValue = this.calculateWorkloadValue(
        input.workloadType || meta.workloadType,
        input.workloadValue || meta.workloadValue,
        bodyweight,
        userData.map((item) => item.sets).flat(),
      );

      const data: TrainingExerciseUserData = {
        userId: member,
        trainingId: ref.trainingId,
        componentId: ref.componentId,
        supersetId: ref.supersetId,
        exerciseId: ref.exerciseId,
        workloadValue,
        // TODO - fix this to keep old set data
        sets: Array.from({ length: input.sets }).map((_, set) => ({
          status: SetStatus.NOT_STARTED,
          setNumber: set + 1,
          setTypeValue: null,
          workloadValue: null,
        })),
      };

      const docRef = this.trainingExerciseUserDataRepository.doc({
        ...ref,
        userId: member,
      });

      batch.set(docRef, data);
      result.push(data);
    }

    await batch.commit();
    return result;
  }

  async updateAthleteSetData(
    ref: Required<TrainingExerciseUserDataRef>,
    input: ExerciseSetData[],
  ) {
    await this.trainingExerciseUserDataRepository.updateSetData(ref, input);
  }

  async removeAll(ref: Required<TrainingExerciseRef>) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_EXERCISE_USER_DATA)
      .where('trainingId', '==', ref.trainingId)
      .where('componentId', '==', ref.componentId)
      .where('supersetId', '==', ref.supersetId)
      .where('exerciseId', '==', ref.exerciseId)
      .get()
      .then(({ docs }) => docs.forEach((doc) => doc.ref.delete()));
  }

  private calculateWorkloadValue(
    workloadType: WorkloadType,
    workloadValue: number,
    bodyweight: number,
    data: ExerciseSetData[],
  ) {
    switch (workloadType) {
      case WorkloadType.RM:
        // fetch 1RM from last month of user exercises, use formula and save value as KG
        const values = data.map(({ setTypeValue, workloadValue }) => ({
          reps: setTypeValue,
          weight: +workloadValue,
        }));

        return this.commonService.number.rm(values);
      case WorkloadType.BW:
        // % of bodyweight
        return (
          (bodyweight || 0) * this.commonService.number.percent(workloadValue)
        );
      case WorkloadType.KG:
      case WorkloadType.INT:
      default:
        return workloadValue;
    }
  }
}
