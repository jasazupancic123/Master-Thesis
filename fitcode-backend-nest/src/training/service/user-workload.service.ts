import { BadRequestException, Injectable } from '@nestjs/common';
import { WriteBatch } from 'firebase-admin/firestore';
import { FirestoreEntity } from '../../common/type/entity.type';
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
import { TrainingStatusRepository } from '../repository/training-status.repository';
import { UserWorkloadRepository } from '../repository/user-workload.repository';
import { IntType, ParamType, VolType } from '../../component/enum/param.enum';

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

    /* input.map(({ exerciseId }) => {
      // add user workload
      const docRef = this.userWorkloadRepository.doc({ ...ref, exerciseId });
      const query = this.firebaseService.buildUpdateQuery<UserWorkload>({
        status: SetStatus.DONE,
      });

      batch.update(docRef, query);
    }); */

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
    batch: WriteBatch,
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
        bodyweight:
          training.wellness.find((m) => m.userId === userId)?.weight ?? 0,
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
        const workloads = history // filter workload history for selected user and exercise
          .filter((e) => e.exerciseId === exercise.id);

        for (const { setNumber, paramValues } of exercise.sets) {
          const docRef = this.userWorkloadRepository
            .collection({ trainingId: training.id })
            .doc();

          const volWork1 = paramValues.find(
            (p) => p.field === ParamType.VolWork1,
          );
          const volWork2 = paramValues.find(
            (p) => p.field === ParamType.VolWork2,
          );
          const volRec = paramValues.find((p) => p.field === ParamType.VolRec1);
          const intWork1 = paramValues.find(
            (p) => p.field === ParamType.IntWork1,
          );
          const intWork2 = paramValues.find(
            (p) => p.field === ParamType.IntWork2,
          );
          const intRec = paramValues.find((p) => p.field === ParamType.IntRec1);

          const query = this.firebaseService.buildCreateQuery<UserWorkload>({
            userId,
            trainingId: training.id,
            componentId: exercise.componentId,
            exerciseId: exercise.id,
            setNumber,
            notes: null,
            volWork1Type: (volWork1?.selected as VolType) || undefined,
            prescribedVolWork1Value: +volWork1?.value || undefined,
            volWork1Value: null,
            volWork2Type: (volWork2?.selected as VolType) || undefined,
            prescribedVolWork2Value: +volWork2?.value || undefined,
            volWork2Value: null,
            volRecType: (volRec?.selected as VolType) || undefined,
            prescribedVolRecValue: +volRec?.value || undefined,
            volRecValue: null,
            intWork1Type: (intWork1?.selected as IntType) || undefined,
            prescribedIntWork1Value:
              intWork1?.selected === IntType.Rm
                ? this.calculateRM(+intWork1.value, workloads)
                : intWork1?.selected === IntType.Bw
                  ? bodyweight *
                    this.commonService.number.percent(+intWork1.value)
                  : [IntType.Mas, IntType.Hrmax].includes(
                        intWork1?.selected as IntType,
                      )
                    ? this.commonService.number.percent(+intWork1.value)
                    : isNaN(+intWork1?.value)
                      ? undefined
                      : +intWork1.value,
            intWork1Value: null,
            intWork2Type: (intWork2?.selected as IntType) || undefined,
            prescribedIntWork2Value:
              intWork2?.selected === IntType.Rm
                ? this.calculateRM(+intWork2.value, workloads)
                : intWork2?.selected === IntType.Bw
                  ? bodyweight *
                    this.commonService.number.percent(+intWork2.value)
                  : [IntType.Mas, IntType.Hrmax].includes(
                        intWork2?.selected as IntType,
                      )
                    ? this.commonService.number.percent(+intWork2.value)
                    : isNaN(+intWork2?.value)
                      ? undefined
                      : +intWork2.value,
            intWork2Value: null,
            intRecType: (intRec?.selected as IntType) || undefined,
            prescribedIntRecValue: +intRec?.value || undefined,
            intRecValue: null,
          });

          batch.set(docRef, query);
        }
      }
    }
  }

  private calculateRM(n: number, data: UserWorkload[]) {
    // fetch 1RM from last month of user exercises, use formula and save value as KG
    const values = data
      .filter(
        (w) =>
          (w.volWork1Type === VolType.Rep && w.volWork1Value) ||
          (w.volWork2Type === VolType.Rep && w.volWork2Value),
      )
      .flatMap((w) => {
        const reps: { reps: number; weight: number }[] = [];
        if (w.volWork1Value && w.intWork1Value)
          reps.push({ reps: w.volWork1Value, weight: w.intWork1Value });

        if (w.volWork2Value && w.intWork2Value)
          reps.push({ reps: w.volWork2Value, weight: w.intWork2Value });

        return reps;
      });

    // find max weight lifted
    const { reps, weight } = values.sort((a, b) => b.weight - a.weight)[0] || {
      reps: 1,
      weight: 0,
    };

    return this.commonService.number.rm(weight, reps <= 0 ? 1 : reps)(n);
  }
}
