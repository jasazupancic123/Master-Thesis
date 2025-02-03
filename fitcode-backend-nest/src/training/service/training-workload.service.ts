import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { TrainingWorkloadRepository } from '../repository/training-workload.repository';
import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';
import { FirebaseService } from '../../firebase/firebase.service';
import { SetData, TrainingWorkload } from '../entity/training-workload.entity';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';
import {
  TrainingExerciseRef,
  TrainingWorkloadRef,
  TrainingRef,
} from '../../common/type/firebase-firestore.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CreateTrainingExerciseUserData,
  UpdateTrainingExerciseUserData,
} from '../type/training-workload.type';
import { User } from '../../common/type/firebase-auth.type';
import { TrainingService } from './training.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { UserService } from '../../user/service/user.service';
import { SetStatus } from '../enum/set-status.enum';
import { FieldPath, FieldValue, Transaction } from 'firebase-admin/firestore';
import { TrainingRepository } from '../repository/training.repository';
import { Training } from '../entity/training.entity';

@Injectable()
export class TrainingWorkloadService {
  private logger = new Logger(TrainingWorkloadService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly trainingWorkloadRepository: TrainingWorkloadRepository,
    private readonly trainingRepository: TrainingRepository,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  /**
   * Gets all training workload data for all trainings for a user by exercise id.
   */
  async findAll(ref: Required<TrainingWorkloadRef>) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', '==', ref.userId)
      .where('exerciseId', '==', ref.exerciseId)
      .get()
      .then(({ docs }) =>
        docs.map((doc) => this.trainingWorkloadRepository.serialize(doc)),
      );
  }

  /**
   * Creates training workload data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  async createMany(
    training: Training,
    ref: Required<TrainingExerciseRef>,
    input: CreateTrainingExerciseUserData,
    allUsersData: { [userId: string]: TrainingWorkload[] },
    transaction?: Transaction,
  ): Promise<TrainingWorkload[]> {
    const result: TrainingWorkload[] = [];

    // for each member, calculate individual values for exercise user data
    const batch = transaction ? null : this.firebaseService.firestore.batch();
    for (const userId of training.membersIds) {
      const userData = allUsersData[userId] || [];
      const workloadValue = this.calculateWorkloadValue(
        input.meta.workloadType,
        input.meta.workloadValue,
        training.bw[userId],
        userData.map((data) => data.sets).flat(),
      );

      const data: TrainingWorkload = {
        userId,
        trainingId: training.id,
        componentId: ref.componentId,
        superset: ref.superset,
        exerciseId: ref.exerciseId,
        workloadType: input.meta.workloadType,
        workloadValue,
        sets: Array.from({ length: input.meta.sets }).map(() => ({
          status: SetStatus.NOT_STARTED,
          setTypeValue: null,
          workloadValue: null,
          notes: null,
        })),
      };

      const docRef = this.trainingWorkloadRepository.doc({
        ...ref,
        userId,
      });

      if (transaction) transaction.set(docRef, data);
      else batch!.set(docRef, data);

      result.push(data);
    }

    if (!transaction) await batch.commit();
    return result;
  }

  /**
   * Create training exercise user data for a single user.
   */
  async create(
    training: Training,
    ref: Required<TrainingWorkloadRef>,
    input: TrainingExerciseMeta,
    workloadData: TrainingWorkload[],
  ): Promise<TrainingWorkload> {
    const workloadValue = this.calculateWorkloadValue(
      input.workloadType,
      input.workloadValue,
      training.bw[ref.userId],
      workloadData.map((item) => item.sets).flat(),
    );

    const data: TrainingWorkload = {
      userId: ref.userId,
      trainingId: ref.trainingId,
      componentId: ref.componentId,
      superset: ref.superset,
      exerciseId: ref.exerciseId,
      workloadType: input.workloadType,
      workloadValue,
      sets: Array.from({ length: input.sets }).map(() => ({
        status: SetStatus.NOT_STARTED,
        setTypeValue: null,
        workloadValue: null,
        notes: null,
      })),
    };

    const docRef = this.trainingWorkloadRepository.doc({
      ...ref,
      userId: ref.userId,
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
    // TODO
  }

  /**
   * Update athlete's set data.
   */
  async updateSets(ref: Required<TrainingWorkloadRef>, input: SetData[]) {
    await this.trainingWorkloadRepository.updateDoc(ref, {
      sets: input,
    });
  }

  /**
   * Updates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and updates them in the
   * correct training component exercise user data document.
   */
  async updateMany(
    training: Training,
    ref: Required<TrainingExerciseRef>,
    input: UpdateTrainingExerciseUserData,
    allUsersData: { [userId: string]: TrainingWorkload[] },
    transaction: Transaction,
  ): Promise<TrainingWorkload[]> {
    const result: TrainingWorkload[] = [];

    // get old meta
    const { meta } =
      training.components[ref.componentId].supersets[ref.superset].exercises[
        ref.exerciseId
      ];

    // if nothing changed, return
    const isWorkloadTypeChanged =
      input.meta?.workloadType && input.meta.workloadType !== meta.workloadType;
    const isWorkloadValueChanged =
      input.meta?.workloadValue &&
      input.meta.workloadValue !== meta.workloadValue;

    if (!isWorkloadTypeChanged && !isWorkloadValueChanged) return;

    // for each member, calculate individual values for exercise user data
    const batch = transaction ? null : this.firebaseService.firestore.batch();
    for (const userId of training.membersIds) {
      const workloadValue = this.calculateWorkloadValue(
        input.meta?.workloadType || meta.workloadType,
        input.meta?.workloadValue || meta.workloadValue,
        training.bw[userId] || 60,
        (allUsersData[userId] || []).map((item) => item.sets).flat(),
      );

      const data: TrainingWorkload = {
        userId,
        trainingId: ref.trainingId,
        componentId: ref.componentId,
        superset: ref.superset,
        exerciseId: ref.exerciseId,
        workloadType: input.meta?.workloadType || meta.workloadType,
        workloadValue,
        // TODO - fix this to keep old set data
        sets: Array.from({ length: input.meta?.sets }).map(() => ({
          status: SetStatus.NOT_STARTED,
          setTypeValue: null,
          workloadValue: null,
          notes: null,
        })),
      };

      const docRef = this.trainingWorkloadRepository.doc({
        ...ref,
        userId: userId,
      });

      if (transaction) transaction.set(docRef, data);
      else batch!.set(docRef, data);

      result.push(data);
    }

    if (!transaction) await batch.commit();
    return result;
  }

  private calculateWorkloadValue(
    workloadType: WorkloadType,
    workloadValue: number,
    bodyweight: number,
    data: SetData[],
  ) {
    switch (workloadType) {
      case WorkloadType.RM:
        // fetch 1RM from last month of user exercises, use formula and save value as KG
        const values = data.map(({ setTypeValue, workloadValue }) => ({
          reps: setTypeValue,
          weight: +workloadValue,
        }));

        // find max weight lifted
        const { reps, weight } = values.sort(
          (a, b) => b.weight - a.weight,
        )[0] || {
          reps: 1,
          weight: 0,
        };

        return this.commonService.number.rm(
          weight,
          reps <= 0 ? 1 : reps,
        )(workloadValue);
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
