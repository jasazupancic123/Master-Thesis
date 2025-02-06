import { Injectable } from '@nestjs/common';
import { UserWorkloadRepository } from '../repository/user-workload.repository';
import { FirebaseService } from '../../firebase/firebase.service';
import { UserWorkload } from '../entity/user-workload.entity';
import { SetData } from '../entity/set-data';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';
import {
  TrainingExerciseRef,
  TrainingRef,
  UserWorkloadExerciseRef,
  ExerciseRef,
  SubgroupRef,
} from '../../common/type/firebase-firestore.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CreateUserWorkload,
  UpdateUserWorkload,
} from '../type/user-workload.type';
import { SetStatus } from '../enum/set-status.enum';
import { Transaction } from 'firebase-admin/firestore';
import { Training } from '../entity/training.entity';

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
      .where(`exercises.${ref.exerciseId}`, '!=', null)
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
        docs
          .map((doc) => this.trainingWorkloadRepository.serialize(doc))
          .reduce(
            (acc, item) => {
              acc[item.userId] = item;
              return acc;
            },
            {} as Record<string, UserWorkload>,
          ),
      );
  }

  async findAllByMembers(
    exerciseId: string,
    membersIds: string[],
  ): Promise<{ [userId: string]: UserWorkload[] }> {
    /* const membersWorkloads = await Promise.all(
      membersIds.map(async (userId) => ({
        userId,
        data: await this.findAll({
          exerciseId,
          userId,
        }),
      })),
    );

    return membersWorkloads.reduce((acc, { userId, data }) => {
      acc[userId] = data;
      return acc;
    }, {}); */

    const workloads = await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', 'in', membersIds)
      .where(`exercises.${exerciseId}`, '!=', null)
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
      [`exercises.${ref.exerciseId}.sets`]: input,
    });
  }

  /**
   * Creates training workload data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  async createForTraining(
    transaction: Transaction,
    ref: TrainingExerciseRef & SubgroupRef,
    membersData: {
      [id: string]: {
        weight: number; // to calculate bodyweight %
        workloads: UserWorkload[]; // to calculate RMs
      };
    },
    input: CreateUserWorkload,
    trainingWorkloads: { [userId: string]: UserWorkload }, // current training workloads
  ): Promise<UserWorkload[]> {
    const result: UserWorkload[] = [];

    // for each member, calculate individual values for exercise user data
    for (const userId of Object.keys(membersData)) {
      const trainingWorkloadExercises =
        trainingWorkloads[userId]?.exercises || {};

      const userWorkloads = membersData[userId]?.workloads || [];
      const userData = userWorkloads.flatMap((item) =>
        Object.values(item.exercises?.[ref.exerciseId] || []).flatMap(
          (v) => v.sets,
        ),
      );

      const workloadValue = this.calculateWorkloadValue(
        input.meta.workloadType,
        input.meta.workloadValue,
        membersData[userId].weight,
        userData,
      );

      const data: UserWorkload = {
        userId,
        trainingId: ref.trainingId,
        subgroupId: ref.subgroupId ?? null,
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

      transaction.set(docRef, data);
      result.push(data);
    }

    return result;
  }

  /**
   * Updates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and updates them in the
   * correct training component exercise user data document.
   */
  async updateByTraining(
    transaction: Transaction,
    ref: TrainingExerciseRef & SubgroupRef,
    membersData: {
      [id: string]: {
        weight: number; // to calculate bodyweight %
        workloads: UserWorkload[]; // to calculate RMs
      };
    },
    input: UpdateUserWorkload,
    trainingWorkloads: { [userId: string]: UserWorkload }, // current training workloads
  ): Promise<UserWorkload[]> {
    const result: UserWorkload[] = [];

    // for each member, calculate individual values for exercise user data
    for (const userId of Object.keys(membersData)) {
      const trainingWorkloadExercises =
        trainingWorkloads[userId]?.exercises || {};

      const userWorkloads = membersData[userId]?.workloads || [];
      const userData = userWorkloads.flatMap((item) =>
        Object.values(item.exercises?.[ref.exerciseId] || []).flatMap(
          (v) => v.sets,
        ),
      );

      const workloadValue = this.calculateWorkloadValue(
        input.meta.workloadType,
        input.meta.workloadValue,
        membersData[userId].weight,
        userData,
      );

      const data: UserWorkload = {
        userId,
        trainingId: ref.trainingId,
        subgroupId: ref.subgroupId ?? null,
        exercises: {
          ...trainingWorkloadExercises,
          [ref.exerciseId]: {
            ...(trainingWorkloadExercises[ref.exerciseId] || {}),
            workloadType: input.meta.workloadType,
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

      transaction.set(docRef, data);
      result.push(data);
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
