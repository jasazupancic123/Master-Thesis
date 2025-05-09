import { Injectable } from '@nestjs/common';
import { WriteBatch } from 'firebase-admin/firestore';
import { FirestoreEntity } from '../../common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CommonService } from '../../common/service/common.service';
import {
  ExerciseRef,
  TrainingComponentRef,
  WorkloadRef,
} from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Training } from '../entity/training.entity';
import { Workload } from '../entity/workload.entity';
import { SetStatus } from '../enum/set-status.enum';
import { WorkloadRepository } from '../repository/workload.repository';
import { IntType, ParamType, VolType } from '../../component/enum/param.enum';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';

@Injectable()
export class UserWorkloadService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly workloadRepository: WorkloadRepository,
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
            doc.data() as FirestoreEntity<Workload>,
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
            doc.data() as FirestoreEntity<Workload>,
          ),
        ),
      );
  }

  async findAllByMembers(membersIds: string[]): Promise<Workload[]> {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', 'in', membersIds)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<Workload>,
          ),
        ),
      );
  }

  getTrainingStatus(ref: TrainingComponentRef, workloads: Workload[]) {
    const users: Record<string, any> = {};

    for (const workload of workloads) {
      if (workload.status === SetStatus.NOT_STARTED) {
        users[workload.userId];
      }
    }
  }

  /**
   * Creates training workload data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  createForTraining(
    batch: WriteBatch,
    training: Training,
    workloads: Workload[], // to calculate RMs
  ) {
    const membersMap: {
      [userId: string]: {
        exercises: (TrainingExercise & { componentId: string })[];
        bodyweight: number;
        history: Workload[];
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
          const docRef = this.workloadRepository
            .collection({ trainingId: training.id })
            .doc(
              this.workloadRepository.getKey({
                trainingId: training.id,
                componentId: exercise.componentId,
                exerciseId: exercise.id,
                setNumber,
                userId,
              }),
            );

          const query = this.firebaseService.buildCreateQuery<Workload>({
            groupId: training.groupId,
            cycleId: training.cycleId,
            userId,
            trainingId: training.id,
            componentId: exercise.componentId,
            exerciseId: exercise.id,
            setNumber,
            status: SetStatus.NOT_STARTED,
            notes: null,
            ...this.parseParamValues(paramValues),
            ...this.calculateIntValues(paramValues, bodyweight, workloads),
          });

          batch.set(docRef, query);
        }
      }
    }
  }

  async updateByTrainingComponent(
    batch: WriteBatch,
    ref: Omit<WorkloadRef, 'exerciseId' | 'setNumber'>,
    workloads: Workload[],
  ) {
    for (const workload of workloads) {
      const docRef = this.workloadRepository
        .collection({ trainingId: ref.trainingId })
        .doc(
          this.workloadRepository.getKey({
            trainingId: ref.trainingId,
            componentId: ref.componentId,
            exerciseId: workload.exerciseId,
            setNumber: workload.setNumber,
            userId: ref.userId,
          }),
        );

      const query = this.firebaseService.buildUpdateQuery<Workload>({
        status: this.getStatus(workload),
        notes: workload.notes || null,
        volWork1Value: workload.volWork1Value || null,
        volWork2Value: workload.volWork2Value || null,
        volRecValue: workload.volRecValue || null,
        intWork1Value: workload.intWork1Value || null,
        intWork2Value: workload.intWork2Value || null,
        intRecValue: workload.intRecValue || null,
      });

      batch.set(docRef, query);
    }
  }

  getStatus(workload: Workload): SetStatus {
    const volWork1Status = this.getStatusByField(
      workload.prescribedVolWork1Value,
      workload.volWork1Value,
    );

    const volWork2Status = this.getStatusByField(
      workload.prescribedVolWork2Value,
      workload.volWork2Value,
    );

    const volRecStatus = this.getStatusByField(
      workload.prescribedVolRecValue,
      workload.volRecValue,
    );

    const intWork1Status = this.getStatusByField(
      workload.prescribedIntWork1Value,
      workload.intWork1Value,
    );

    const intWork2Status = this.getStatusByField(
      workload.prescribedIntWork2Value,
      workload.intWork2Value,
    );

    const intRecStatus = this.getStatusByField(
      workload.prescribedIntRecValue,
      workload.intRecValue,
    );

    const fieldStatus = [
      volWork1Status,
      volWork2Status,
      volRecStatus,
      intWork1Status,
      intWork2Status,
      intRecStatus,
    ];

    // edge case - every performed value is ignored
    if (fieldStatus.every((status) => status === SetStatus.IGNORED))
      return SetStatus.COMPLETED;

    // not started if every performed value is not started or ignored
    if (
      fieldStatus.every((status) =>
        [SetStatus.NOT_STARTED, SetStatus.IGNORED].includes(status),
      )
    )
      return SetStatus.NOT_STARTED;

    // completed if every performed value is completed or ignored
    if (
      fieldStatus.every((status) =>
        [SetStatus.COMPLETED, SetStatus.IGNORED].includes(status),
      )
    )
      return SetStatus.COMPLETED;

    // over-performed if every performed value is over-performed or ignored
    if (
      fieldStatus.every((status) =>
        [SetStatus.OVER, SetStatus.IGNORED].includes(status),
      )
    )
      return SetStatus.OVER;

    // else, it's partial set
    return SetStatus.PARTIAL;
  }

  private getStatusByField(
    prescribedValue?: number,
    performedValue?: number,
  ): SetStatus {
    if (prescribedValue === undefined || prescribedValue === null)
      return SetStatus.IGNORED; // field not prescribed, ignore
    if (performedValue === undefined || performedValue === null)
      return SetStatus.NOT_STARTED; // field prescribed, but not performed

    if (performedValue < prescribedValue) return SetStatus.PARTIAL; // partial set
    if (performedValue === prescribedValue) return SetStatus.COMPLETED; // completed set
    if (performedValue > prescribedValue) return SetStatus.OVER; // over-completed set
  }

  private calculateRM(n: number, data: Workload[]) {
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

  private parseParamValues(paramValues: AttributeValue[]) {
    const volWork1 = paramValues.find((p) => p.field === ParamType.VolWork1);
    const volWork2 = paramValues.find((p) => p.field === ParamType.VolWork2);
    const volRec = paramValues.find((p) => p.field === ParamType.VolRec1);
    const intWork1 = paramValues.find((p) => p.field === ParamType.IntWork1);
    const intWork2 = paramValues.find((p) => p.field === ParamType.IntWork2);
    const intRec = paramValues.find((p) => p.field === ParamType.IntRec1);

    return {
      volWork1Type: this.parseSelected<VolType>(volWork1),
      prescribedVolWork1Value: this.parseValue(volWork1) as number,
      volWork1Value: null,
      volWork2Type: this.parseSelected<VolType>(volWork2),
      prescribedVolWork2Value: this.parseValue(volWork2) as number,
      volWork2Value: null,
      volRecType: this.parseSelected<VolType>(volRec),
      prescribedVolRecValue: this.parseValue(volRec) as number,
      volRecValue: null,
      intWork1Type: this.parseSelected<IntType>(intWork1),
      intWork1Value: null,
      intWork2Type: this.parseSelected<IntType>(intWork2),
      intWork2Value: null,
      intRecType: this.parseSelected<IntType>(intRec),
      prescribedIntRecValue: this.parseValue(intRec),
      intRecValue: null,
    };
  }

  private calculateIntValues(
    paramValues: AttributeValue[],
    bodyweight: number,
    workloads: Workload[],
  ) {
    const intWork1 = paramValues.find((p) => p.field === ParamType.IntWork1);
    const intWork1Field = this.parseSelected<IntType>(intWork1);
    const intWork1Value = this.parseValue(intWork1);

    const intWork2 = paramValues.find((p) => p.field === ParamType.IntWork2);
    const intWork2Field = this.parseSelected<IntType>(intWork2);
    const intWork2Value = this.parseValue(intWork2);

    return {
      prescribedIntWork1Value: isNaN(intWork1Value)
        ? undefined
        : intWork1Field === IntType.Rm && !isNaN(intWork1Value)
          ? this.calculateRM(intWork1Value, workloads)
          : intWork1Field === IntType.Bw && !isNaN(intWork1Value)
            ? bodyweight * this.commonService.number.percent(intWork1Value)
            : [IntType.Mas, IntType.Hrmax].includes(intWork1Field) &&
                !isNaN(intWork1Value)
              ? this.commonService.number.percent(intWork1Value)
              : intWork1Value,
      prescribedIntWork2Value: isNaN(intWork1Value)
        ? undefined
        : intWork2Field === IntType.Rm && !isNaN(intWork2Value)
          ? this.calculateRM(intWork2Value, workloads)
          : intWork2Field === IntType.Bw && !isNaN(intWork2Value)
            ? bodyweight * this.commonService.number.percent(intWork2Value)
            : [IntType.Mas, IntType.Hrmax].includes(intWork2Field) &&
                !isNaN(intWork1Value)
              ? this.commonService.number.percent(intWork2Value)
              : intWork2Value,
    };
  }

  private parseSelected<T = string>(
    attributeValue: AttributeValue,
  ): T | undefined {
    if (!attributeValue?.selected) return undefined;
    return attributeValue.selected.split(':')[0] as T;
  }

  private parseValue(attributeValue: AttributeValue): number | undefined {
    if (!attributeValue?.value) return undefined;
    if (attributeValue?.value)
      if (!isNaN(+attributeValue.value)) return +attributeValue.value;

    return NaN;
  }
}
