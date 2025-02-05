import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { TrainingWorkloadRepository } from '../repository/training-workload.repository';
import { FirebaseService } from '../../firebase/firebase.service';
import { SetData, TrainingWorkload } from '../entity/training-workload.entity';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';
import {
  TrainingExerciseRef,
  TrainingWorkloadRef,
  TrainingRef,
  TrainingWorkloadExerciseRef,
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
import { Transaction } from 'firebase-admin/firestore';
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
  async findAll(ref: Required<TrainingWorkloadExerciseRef>) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', '==', ref.userId)
      .where(`exercises.${ref.exerciseId}`, '!=', null)
      .get()
      .then(({ docs }) =>
        docs.map((doc) => this.trainingWorkloadRepository.serialize(doc)),
      );
  }

  async findAllByTraining(ref: Required<TrainingRef>) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('trainingId', '==', ref.trainingId)
      .get()
      .then(({ docs }) =>
        docs.map((doc) => this.trainingWorkloadRepository.serialize(doc)),
      );
  }

  /**
   * Update athlete's set data.
   */
  async updateSets(
    ref: Required<TrainingWorkloadExerciseRef>,
    input: SetData[],
  ) {
    await this.trainingWorkloadRepository.updateDoc(ref, {
      [`exercises.${ref.exerciseId}.sets`]: input,
    });
  }

  /**
   * Creates training workload data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  async createByTraining(
    training: Training,
    ref: Required<TrainingExerciseRef>,
    input: CreateTrainingExerciseUserData,
    allUsersData: { [userId: string]: TrainingWorkload[] }, // data from all users for current exercise
    trainingWorkloads: { [userId: string]: TrainingWorkload }, // data from all users for current training (all exercises)
    transaction?: Transaction,
  ): Promise<TrainingWorkload[]> {
    const result: TrainingWorkload[] = [];

    // for each member, calculate individual values for exercise user data
    const batch = transaction ? null : this.firebaseService.firestore.batch();
    for (const userId of training.membersIds) {
      const trainingWorkloadExercises =
        trainingWorkloads[userId]?.exercises || {};

      const userWorkloads = allUsersData[userId] || [];
      const userData = userWorkloads.flatMap((item) =>
        Object.values(item.exercises?.[ref.exerciseId] || []).flatMap(
          (v) => v.sets,
        ),
      );

      const workloadValue = this.calculateWorkloadValue(
        input.meta.workloadType,
        input.meta.workloadValue,
        training.meta[userId].weight || 0,
        userData,
      );

      const data: TrainingWorkload = {
        userId,
        trainingId: ref.trainingId,
        exercises: {
          ...trainingWorkloadExercises,
          [ref.exerciseId]: {
            ...(trainingWorkloadExercises[ref.exerciseId] || {}),
            workloadType: input.meta.workloadType,
            workloadValue,
            sets: Array.from({ length: input.meta.sets }).map(() => ({
              status: SetStatus.NOT_STARTED,
              setTypeValue: null,
              workloadValue: null,
              notes: null,
            })),
          },
        },
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
   * Updates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and updates them in the
   * correct training component exercise user data document.
   */
  async updateByTraining(
    training: Training,
    ref: Required<TrainingExerciseRef>,
    input: UpdateTrainingExerciseUserData,
    allUsersData: { [userId: string]: TrainingWorkload[] }, // data from all users for current exercise
    trainingWorkloads: { [userId: string]: TrainingWorkload }, // data from all users for current training (all exercises)
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
      const trainingWorkloadExercises =
        trainingWorkloads[userId]?.exercises || {};

      const userWorkloads = allUsersData[userId] || [];
      const userData = userWorkloads.flatMap((item) =>
        Object.values(item.exercises?.[ref.exerciseId] || []).flatMap(
          (v) => v.sets,
        ),
      );

      const workloadValue = this.calculateWorkloadValue(
        input.meta?.workloadType || meta.workloadType,
        input.meta?.workloadValue || meta.workloadValue,
        training.meta[userId].weight || 0,
        userData,
      );

      const data: TrainingWorkload = {
        userId,
        trainingId: ref.trainingId,
        exercises: {
          ...trainingWorkloadExercises,
          [ref.exerciseId]: {
            ...(trainingWorkloadExercises[ref.exerciseId] || {}),
            workloadType: input.meta?.workloadType || meta.workloadType,
            workloadValue,
            // TODO - fix this to keep old set data
            sets: Array.from({ length: input.meta?.sets }).map(() => ({
              status: SetStatus.NOT_STARTED,
              setTypeValue: null,
              workloadValue: null,
              notes: null,
            })),
          },
        },
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
        const values = data
          .filter((set) => !!set)
          .map(({ setTypeValue, workloadValue }) => ({
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
