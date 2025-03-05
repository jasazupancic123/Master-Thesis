import { Injectable } from '@nestjs/common';
import { Transaction, WriteBatch } from 'firebase-admin/firestore';
import { Create, FirestoreEntity } from 'src/common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CommonService } from '../../common/service/common.service';
import {
  ExerciseRef,
  TrainingStatusRef,
} from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingStatus } from '../entity/training-status.entity';
import { Training } from '../entity/training.entity';
import { UserWorkload } from '../entity/user-workload.entity';
import { SetStatus } from '../enum/set-status.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { TrainingStatusRepository } from '../repository/training-status.repository';
import { UserWorkloadRepository } from '../repository/user-workload.repository';

@Injectable()
export class UserWorkloadService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userWorkloadRepository: UserWorkloadRepository,
    private readonly trainingStatusRepository: TrainingStatusRepository,
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
   * Update athlete's set data for all exercises in the provided training's component.
   */
  async updateExercisesWorkloadsByComponent(
    ref: TrainingStatusRef,
    input: UserWorkload[],
  ) {
    const batch = this.firebaseService.firestore.batch();

    input.map(({ exerciseId }) => {
      // add user workload
      const docRef = this.userWorkloadRepository.doc({ ...ref, exerciseId });
      const query = this.firebaseService.buildUpdateQuery<UserWorkload>({
        status: SetStatus.DONE,
      });

      batch.update(docRef, query);
    });

    // add training status doc
    const query = this.firebaseService.buildCreateQuery<TrainingStatus>(
      {
        userId: ref.userId,
        trainingId: ref.trainingId,
        componentId: ref.componentId,
        status: SetStatus.DONE,
      },
      { timestamps: true },
    );

    const docRef = this.trainingStatusRepository.doc(ref);
    batch.set(docRef, query);

    await batch.commit();
  }

  /**
   * Creates training workload data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  createForTraining(
    batch: WriteBatch | Transaction,
    training: Training,
    workloads: UserWorkload[], // to calculate RMs
  ) {
    const membersMap: {
      [userId: string]: {
        exercises: (TrainingExercise & { componentId: string })[];
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
            membersMap[userId].exercises.push({
              ...exercise,
              componentId: component.id,
            });

      // workloads for subgroups
      for (const subgroup of component.subgroups)
        for (const superset of subgroup.supersets)
          for (const exercise of superset.exercises)
            for (const userId of subgroup.membersIds)
              membersMap[userId].exercises.push({
                ...exercise,
                componentId: component.id,
              });
    }

    // for each member, calculate individual values for exercise user data
    for (const userId of Object.keys(membersMap)) {
      const { exercises, bodyweight, history } = membersMap[userId];

      for (const exercise of exercises) {
        const { workloadType, workloadValue, set, setType, setTypeValue } =
          exercise.params;

        const workloads = history // filter workload history for selected user and exercise
          .filter((e) => e.exerciseId === exercise.id);

        const calculatedWorkloadValue = this.calculateWorkloadValue(
          workloadType,
          workloadValue,
          bodyweight,
          workloads,
        );

        const data: Create<UserWorkload>[] = Array.from({ length: set }).map(
          (_, setNumber) => ({
            userId,
            trainingId: training.id,
            componentId: exercise.componentId,
            exerciseId: exercise.id,
            sets: set,
            setType,
            prescribedSetTypeValue: setTypeValue,
            workloadType,
            prescribedWorkloadValue: calculatedWorkloadValue,
            status: SetStatus.NOT_STARTED,
            set: setNumber + 1,
            setTypeValue: 0,
            workloadValue: 0,
            notes: null,
          }),
        );

        const docRef = this.userWorkloadRepository.doc({
          trainingId: training.id,
          componentId: exercise.componentId,
          exerciseId: exercise.id,
          userId,
        });

        const query = this.firebaseService.buildCreateQuery(data);

        if (batch instanceof Transaction) batch.set(docRef, query);
        else batch.set(docRef, query);
      }
    }
  }

  private calculateWorkloadValue(
    workloadType: string,
    workloadValue: number,
    bodyweight: number, // for bodyweight %
    data: UserWorkload[], // history data for RM
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
      default:
        return workloadValue;
    }
  }
}
