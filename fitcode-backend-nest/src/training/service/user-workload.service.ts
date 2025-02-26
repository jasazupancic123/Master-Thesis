import { Injectable } from '@nestjs/common';
import { Timestamp, Transaction, WriteBatch } from 'firebase-admin/firestore';
import { Create, FirestoreEntity } from 'src/common/type/entity.type';
import { UserMeta } from 'src/user/entity/user-meta.entity';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CommonService } from '../../common/service/common.service';
import {
  ExerciseRef,
  SubgroupRef,
  TrainingExerciseRef,
  UserWorkloadExerciseRef,
} from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { ExerciseMeta } from '../entity/exercise-meta.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Training } from '../entity/training.entity';
import { UserWorkload } from '../entity/user-workload.entity';
import { WorkloadData } from '../entity/workload-data';
import { SetStatus } from '../enum/set-status.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { UserWorkloadRepository } from '../repository/user-workload.repository';

@Injectable()
export class UserWorkloadService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userWorkloadRepository: UserWorkloadRepository,
  ) {}

  /**
   * Gets all training workload data for all trainings for a user by exercise id.
   */
  async findAll(ref: ExerciseRef & { userId: string }) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', '==', ref.userId)
      .where('exerciseId', '==', ref.exerciseId)
      .where('status', '!=', SetStatus.NOT_STARTED)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<UserWorkload>,
          ),
        ),
      );
  }

  async findAllByTraining(trainingId: string) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('trainingId', '==', trainingId)
      .where('status', '!=', SetStatus.NOT_STARTED)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<UserWorkload>,
          ),
        ),
      );
  }

  async findAllByMembers(membersIds: string[]): Promise<UserWorkload[]> {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', 'in', membersIds)
      .where('status', '!=', SetStatus.NOT_STARTED)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<UserWorkload>,
          ),
        ),
      );
  }

  /**
   * Update athlete's set data.
   */
  async updateData(ref: UserWorkloadExerciseRef, input: WorkloadData[]) {
    const workload = await this.userWorkloadRepository.getDoc(ref);

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      const docRef = this.userWorkloadRepository.doc(ref);
      const query = this.firebaseService.buildUpdateQuery<UserWorkload>({
        data: input,
        status:
          input.length === 0
            ? SetStatus.NOT_STARTED
            : input.length === workload.sets
              ? SetStatus.DONE
              : SetStatus.IN_PROGRESS,
      });

      transaction.update(docRef, query);
    });
  }

  /**
   * Creates training workload data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  createForTraining(
    batch: WriteBatch,
    training: Training,
    workloads: UserWorkload[], // to calculate RMs
  ) {
    const membersMap: {
      [userId: string]: {
        exercises: TrainingExercise[];
        bodyweight: number;
        history: UserWorkload[];
      };
    } = {};

    for (const userId of training.membersIds)
      membersMap[userId] = {
        exercises: [],
        bodyweight: training.meta.find((m) => m.userId === userId)?.weight ?? 0,
        history: workloads.filter((w) => w.userId === userId),
      };

    for (const component of training.components) {
      // workloads for main training group
      for (const superset of component.supersets)
        for (const exercise of superset.exercises)
          for (const userId of training.membersIds)
            membersMap[userId].exercises.push(exercise);

      // workloads for subgroups
      for (const subgroup of component.subgroups)
        for (const superset of subgroup.supersets)
          for (const exercise of superset.exercises)
            for (const userId of subgroup.membersIds)
              membersMap[userId].exercises.push(exercise);
    }

    // for each member, calculate individual values for exercise user data
    for (const userId of Object.keys(membersMap)) {
      const { exercises, bodyweight, history } = membersMap[userId];

      for (const exercise of exercises) {
        const { workloadType, workloadValue, sets, setType, setTypeValue } =
          exercise.meta;

        const setData = history // filter workload history for selected user and exercise
          .filter((e) => e.exerciseId === exercise.id)
          .flatMap((w) => w.data);

        const calculatedWorkloadValue = this.calculateWorkloadValue(
          workloadType,
          workloadValue,
          bodyweight,
          setData,
        );

        const data: Create<UserWorkload> = {
          userId,
          trainingId: training.id,
          exerciseId: exercise.id,
          sets,
          setType,
          setTypeValue,
          workloadType,
          workloadValue: calculatedWorkloadValue,
          status: SetStatus.NOT_STARTED,
          data: [],
        };

        const docRef = this.userWorkloadRepository.doc({
          trainingId: training.id,
          exerciseId: exercise.id,
          userId,
        });

        const query = this.firebaseService.buildCreateQuery(data);
        batch.set(docRef, query);
      }
    }
  }

  private calculateWorkloadValue(
    workloadType: WorkloadType,
    workloadValue: number,
    bodyweight: number, // for bodyweight %
    data: WorkloadData[], // history data for RM
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
