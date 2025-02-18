import { Injectable } from '@nestjs/common';
import { FieldValue, Timestamp, Transaction } from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CommonService } from '../../common/service/common.service';
import {
  ExerciseRef,
  SubgroupRef,
  TrainingExerciseRef,
  TrainingRef,
  UserWorkloadExerciseRef,
} from '../../common/type/firebase-firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { SetData } from '../entity/set-data';
import { Training } from '../entity/training.entity';
import { UserWorkload } from '../entity/user-workload.entity';
import { SetStatus } from '../enum/set-status.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { UserWorkloadRepository } from '../repository/user-workload.repository';
import {
  CreateUserWorkload,
  UpdateUserWorkload,
} from '../type/user-workload.type';

@Injectable()
export class UserWorkloadService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly trainingWorkloadRepository: UserWorkloadRepository,
  ) {}

  /**
   * Gets all training workload data for all trainings for a user by exercise id.
   */
  async findAll(ref: ExerciseRef & { userId: string }) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', '==', ref.userId)
      .where('exerciseId', '==', ref.exerciseId)
      .get()
      .then(({ docs }) =>
        docs.map((doc) => this.trainingWorkloadRepository.serialize(doc)),
      );
  }

  async findAllByTraining(trainingId: string) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('trainingId', '==', trainingId)
      .get()
      .then(({ docs }) =>
        docs.map((doc) => this.trainingWorkloadRepository.serialize(doc)),
      );
  }

  async findAllByMembers(
    exerciseId: string,
    membersIds: string[],
  ): Promise<{ [userId: string]: UserWorkload[] }> {
    const workloads = await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', 'in', membersIds)
      .where('exerciseId', '==', exerciseId)
      .get()
      .then(({ docs }) =>
        docs.map((doc) => this.trainingWorkloadRepository.serialize(doc)),
      );

    // group workloads by userId
    const result: { [userId: string]: UserWorkload[] } = {};
    workloads.forEach((w) => {
      const { userId } = w;
      if (!result[userId]) result[userId] = [];
      result[userId].push(w);
    });

    return result;
  }

  /**
   * Update athlete's set data.
   */
  async updateSets(ref: UserWorkloadExerciseRef, input: SetData[]) {
    await this.trainingWorkloadRepository.updateDoc(ref, {
      [`exercises.${ref.exerciseId}.sets`]: input.map((set) => ({ ...set })),
    });
  }

  /**
   * Creates training workload data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  createForTraining(
    transaction: Transaction,
    ref: TrainingExerciseRef & SubgroupRef,
    membersData: {
      [id: string]: {
        weight: number; // to calculate bodyweight %
        workloads: UserWorkload[]; // to calculate RMs
      };
    },
    input: CreateUserWorkload,
  ): UserWorkload[] {
    const result: UserWorkload[] = [];

    // for each member, calculate individual values for exercise user data
    for (const userId of Object.keys(membersData)) {
      const userWorkloads = membersData[userId]?.workloads || [];
      const userData = userWorkloads.flatMap((item) => item.sets);
      const workloadValue = this.calculateWorkloadValue(
        input.meta.workloadType,
        input.meta.workloadValue,
        membersData[userId].weight,
        userData,
      );

      const data: Omit<UserWorkload, 'createdAt' | 'updatedAt'> = {
        userId,
        trainingId: ref.trainingId,
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

      const docRef = this.trainingWorkloadRepository.doc({ ...ref, userId });
      transaction.set(docRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      result.push({ ...data, createdAt: new Date(), updatedAt: new Date() });
    }

    return result;
  }

  /**
   * Updates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and updates them in the
   * correct training component exercise user data document.
   */
  updateByTraining(
    transaction: Transaction,
    ref: TrainingExerciseRef & SubgroupRef,
    membersData: {
      [id: string]: {
        weight: number; // to calculate bodyweight %
        workloads: UserWorkload[]; // to calculate RMs
      };
    },
    input: UpdateUserWorkload,
  ): UserWorkload[] {
    const result: UserWorkload[] = [];

    // for each member, calculate individual values for exercise user data
    for (const userId of Object.keys(membersData)) {
      const userWorkloads = membersData[userId]?.workloads || [];
      const userData = userWorkloads.flatMap((item) => item.sets);
      const workloadValue = this.calculateWorkloadValue(
        input.meta.workloadType,
        input.meta.workloadValue,
        membersData[userId].weight,
        userData,
      );

      const data: Omit<UserWorkload, 'createdAt' | 'updatedAt'> = {
        userId,
        trainingId: ref.trainingId,
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

      const docRef = this.trainingWorkloadRepository.doc({ ...ref, userId });
      transaction.set(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });

      result.push({ ...data, createdAt: new Date(), updatedAt: new Date() });
    }

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
