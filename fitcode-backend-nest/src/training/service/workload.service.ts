import { Injectable } from '@nestjs/common';
import { CollectionGroup, WriteBatch } from 'firebase-admin/firestore';
import { FirestoreEntity } from '../../common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CommonService } from '../../common/service/common.service';
import {
  ExerciseRef,
  GroupRef,
  TrainingComponentRef,
  UserRef,
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
import { TimestampEntity } from '../../common/entity/timestamp.entity';

@Injectable()
export class WorkloadService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly workloadRepository: WorkloadRepository,
  ) {}

  getDoc(id: WorkloadRef) {
    return this.workloadRepository.doc(id);
  }

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

  async findOne(
    trainingId: string,
    componentId: string,
    exerciseId: string,
    setNumber: number,
    userId: string,
  ) {
    return await this.workloadRepository
      .collection({ trainingId })
      .doc(
        this.workloadRepository.getKey({
          trainingId,
          componentId,
          exerciseId,
          setNumber,
          userId,
        }),
      )
      .get()
      .then((doc) => {
        if (!doc.exists) return null;
        return this.firebaseService.serialize(
          doc.data() as FirestoreEntity<Workload>,
        );
      });
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

  /**
   * Fetch all workloads by provided refs. For example, if only groupId is provided, then it will
   * fetch all workloads for a specific group (for all trainings, users, ...). If groupId and
   * userId is provided, then workloads for only one user for the whole group will be fetched and
   * so on.
   */
  async findAllByRef(
    ref: Partial<
      WorkloadRef & GroupRef & { memberIds: string[]; exerciseIds: string[] }
    >,
  ) {
    let query = this.firebaseService.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );

    if (ref.groupId)
      query = query.where('groupId', '==', ref.groupId) as CollectionGroup;

    if (ref.trainingId)
      query = query.where(
        'trainingId',
        '==',
        ref.trainingId,
      ) as CollectionGroup;

    if (ref.memberIds)
      query = query.where('userId', 'in', ref.memberIds) as CollectionGroup;
    else if (ref.userId)
      query = query.where('userId', '==', ref.userId) as CollectionGroup;

    if (ref.componentId)
      query = query.where(
        'componentId',
        '==',
        ref.componentId,
      ) as CollectionGroup;

    if (ref.exerciseIds)
      query = query.where(
        'exerciseId',
        'in',
        ref.exerciseIds,
      ) as CollectionGroup;
    else if (ref.exerciseId)
      query = query.where(
        'exerciseId',
        '==',
        ref.exerciseId,
      ) as CollectionGroup;

    return query
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

  async findAllByMembersGroupExerciseIds(
    membersIds: string[],
    groupId: string,
    exerciseIds: string[],
  ): Promise<Workload[]> {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', 'in', membersIds)
      .where('groupId', '==', groupId)
      .where('exerciseId', 'in', exerciseIds)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<Workload>,
          ),
        ),
      );
  }

  async findAllByUserTrainingComponentId(
    athleteId: string,
    trainingId: string,
    componentId: string,
  ): Promise<Workload[]> {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', '==', athleteId)
      .where('trainingId', '==', trainingId)
      .where('componentId', '==', componentId)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<Workload & TimestampEntity>,
          ),
        ),
      );
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
        exercises: [], // populated in the next loop
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

        for (const { setNumber, paramValuesL: paramValues } of exercise.sets) {
          // skip if workload is already personalized
          const existing = workloads.find(
            (w) =>
              w.trainingId === training.id &&
              w.exerciseId === exercise.id &&
              w.setNumber === setNumber &&
              w.userId === userId,
          );

          if (existing?.isPersonalized) continue;

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

          const query = this.firebaseService.buildCreateQuery<Workload>(
            {
              groupId: training.groupId,
              cycleId: training.cycleId,
              userId,
              trainingId: training.id,
              componentId: exercise.componentId,
              exerciseId: exercise.id,
              setNumber,
              status: SetStatus.NOT_STARTED,
              plannedAt: training.from,
              notes: null,
              isPersonalized: false,
              ...this.parsePrescribedParamValues(paramValues),
              ...this.calculateIntValues(paramValues, bodyweight, workloads),
            },
            { timestamps: true },
          );

          batch.set(docRef, query);
        }
      }
    }
  }

  createForCustomAthleteWorkloads(batch: WriteBatch, workloads: Workload[]) {
    for (const workload of workloads) {
      const docRef = this.workloadRepository
        .collection({ trainingId: workload.trainingId })
        .doc(
          this.workloadRepository.getKey({
            trainingId: workload.trainingId,
            componentId: workload.componentId,
            exerciseId: workload.exerciseId,
            setNumber: workload.setNumber,
            userId: workload.userId,
          }),
        );

      const query = this.firebaseService.buildCreateQuery<Workload>(
        {
          groupId: workload.groupId,
          cycleId: workload.cycleId,
          userId: workload.userId,
          trainingId: workload.trainingId,
          componentId: workload.componentId,
          exerciseId: workload.exerciseId,
          setNumber: workload.setNumber,
          status: SetStatus.NOT_STARTED,
          plannedAt: new Date(),
          notes: null,
          isPersonalized: true,
          prescribedIntRecValueL: workload.prescribedIntRecValueL,
          prescribedIntRecValueR: workload.prescribedIntRecValueR,
          prescribedIntWork1ValueL: workload.prescribedIntWork1ValueL,
          prescribedIntWork1ValueR: workload.prescribedIntWork1ValueR,
          prescribedIntWork2ValueL: workload.prescribedIntWork2ValueL,
          prescribedIntWork2ValueR: workload.prescribedIntWork2ValueR,
          prescribedVolRecValueL: workload.prescribedVolRecValueL,
          prescribedVolRecValueR: workload.prescribedVolRecValueR,
          prescribedVolWork1ValueL: workload.prescribedVolWork1ValueL,
          prescribedVolWork1ValueR: workload.prescribedVolWork1ValueR,
          prescribedVolWork2ValueL: workload.prescribedVolWork2ValueL,
          prescribedVolWork2ValueR: workload.prescribedVolWork2ValueR,
        },
        { timestamps: true },
      );

      batch.set(docRef, query);
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
        volWork1ValueL: workload.volWork1ValueL || null,
        volWork1ValueR: workload.volWork1ValueR || null,
        volWork2ValueL: workload.volWork2ValueL || null,
        volWork2ValueR: workload.volWork2ValueR || null,
        volRecValueL: workload.volRecValueL || null,
        volRecValueR: workload.volRecValueR || null,
        intWork1ValueL: workload.intWork1ValueL || null,
        intWork1ValueR: workload.intWork1ValueR || null,
        intWork2ValueL: workload.intWork2ValueL || null,
        intWork2ValueR: workload.intWork2ValueR || null,
        intRecValueL: workload.intRecValueL || null,
        intRecValueR: workload.intRecValueR || null,
      });

      batch.set(docRef, query);
    }
  }

  getStatus(workload: Workload): SetStatus {
    const volWork1Status = this.getStatusByField(
      workload.prescribedVolWork1ValueL,
      workload.volWork1ValueL,
    );

    const volWork2Status = this.getStatusByField(
      workload.prescribedVolWork2ValueL,
      workload.volWork2ValueL,
    );

    const volRecStatus = this.getStatusByField(
      workload.prescribedVolRecValueL,
      workload.volRecValueL,
    );

    const intWork1Status = this.getStatusByField(
      workload.prescribedIntWork1ValueL,
      workload.intWork1ValueL,
    );

    const intWork2Status = this.getStatusByField(
      workload.prescribedIntWork2ValueL,
      workload.intWork2ValueL,
    );

    const intRecStatus = this.getStatusByField(
      workload.prescribedIntRecValueL,
      workload.intRecValueL,
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

    // TODO - currently, this is comparing STRING values, not numbers, so it will be wrong
    if (performedValue < prescribedValue) return SetStatus.PARTIAL; // partial set
    if (performedValue === prescribedValue) return SetStatus.COMPLETED; // completed set
    if (performedValue > prescribedValue) return SetStatus.OVER; // over-completed set
  }

  private calculateRM(n: number, data: Workload[]) {
    // fetch 1RM from last month of user exercises, use formula and save value as KG
    const values = data
      .filter(
        (w) =>
          (w.volWork1Type === VolType.Rep && w.volWork1ValueL) ||
          (w.volWork2Type === VolType.Rep && w.volWork2ValueL),
      )
      .flatMap((w) => {
        const reps: { reps: number; weight: number }[] = [];
        if (w.volWork1ValueL && w.intWork1ValueL)
          reps.push({ reps: w.volWork1ValueL, weight: w.intWork1ValueL });

        if (w.volWork2ValueL && w.intWork2ValueL)
          reps.push({ reps: w.volWork2ValueL, weight: w.intWork2ValueL });

        return reps;
      });

    // find max weight lifted
    const { reps, weight } = values.sort((a, b) => b.weight - a.weight)[0] || {
      reps: 1,
      weight: 0,
    };

    return this.commonService.number.rm(weight, reps <= 0 ? 1 : reps)(n);
  }

  /**
   * Parses values that athlete completed, so it's assumed that `paramValues`
   * are populated with correct values
   */
  parseActualParamValues(paramValues: AttributeValue[]) {
    const volWork1 = paramValues.find((p) => p.field === ParamType.VolWork1);
    const volWork2 = paramValues.find((p) => p.field === ParamType.VolWork2);
    const volRec = paramValues.find((p) => p.field === ParamType.VolRec1);
    const intWork1 = paramValues.find((p) => p.field === ParamType.IntWork1);
    const intWork2 = paramValues.find((p) => p.field === ParamType.IntWork2);
    const intRec = paramValues.find((p) => p.field === ParamType.IntRec1);

    return {
      volWork1Value: this.parseValue(volWork1),
      volWork2Value: this.parseValue(volWork2),
      volRecValue: this.parseValue(volRec),
      intWork1Value: this.parseValue(intWork1),
      intWork2Value: this.parseValue(intWork2),
      intRecValue: this.parseValue(intRec),
    };
  }

  private parsePrescribedParamValues(
    paramValues: AttributeValue[],
  ): Pick<
    Workload,
    | 'volWork1Type'
    | 'prescribedVolWork1ValueL'
    | 'prescribedVolWork1ValueR'
    | 'volWork1ValueL'
    | 'volWork1ValueR'
    | 'volWork2Type'
    | 'prescribedVolWork2ValueL'
    | 'prescribedVolWork2ValueR'
    | 'volWork2ValueL'
    | 'volWork2ValueR'
    | 'volRecType'
    | 'prescribedVolRecValueL'
    | 'prescribedVolRecValueR'
    | 'volRecValueL'
    | 'volRecValueR'
    | 'intWork1Type'
    | 'prescribedIntWork1ValueL'
    | 'prescribedIntWork1ValueR'
    | 'intWork1ValueL'
    | 'intWork1ValueR'
    | 'intWork2Type'
    | 'prescribedIntWork2ValueL'
    | 'prescribedIntWork2ValueR'
    | 'intWork2ValueL'
    | 'intWork2ValueR'
    | 'intRecType'
    | 'prescribedIntRecValueL'
    | 'prescribedIntRecValueR'
    | 'intRecValueL'
    | 'intRecValueR'
  > {
    const volWork1 = paramValues.find((p) => p.field === ParamType.VolWork1);
    const volWork2 = paramValues.find((p) => p.field === ParamType.VolWork2);
    const volRec = paramValues.find((p) => p.field === ParamType.VolRec1);
    const intWork1 = paramValues.find((p) => p.field === ParamType.IntWork1);
    const intWork2 = paramValues.find((p) => p.field === ParamType.IntWork2);
    const intRec = paramValues.find((p) => p.field === ParamType.IntRec1);

    return {
      volWork1Type: this.parseSelected<VolType>(volWork1),
      prescribedVolWork1ValueL: this.parseValue(volWork1) as number,
      prescribedVolWork1ValueR: this.parseValue(volWork1) as number,
      volWork1ValueL: null,
      volWork1ValueR: null,
      volWork2Type: this.parseSelected<VolType>(volWork2),
      prescribedVolWork2ValueL: this.parseValue(volWork2) as number,
      prescribedVolWork2ValueR: this.parseValue(volWork2) as number,
      volWork2ValueL: null,
      volWork2ValueR: null,
      volRecType: this.parseSelected<VolType>(volRec),
      prescribedVolRecValueL: this.parseValue(volRec) as number,
      prescribedVolRecValueR: this.parseValue(volRec) as number,
      volRecValueL: null,
      volRecValueR: null,
      intWork1Type: this.parseSelected<IntType>(intWork1),
      intWork1ValueL: null,
      intWork1ValueR: null,
      intWork2Type: this.parseSelected<IntType>(intWork2),
      intWork2ValueL: null,
      intWork2ValueR: null,
      intRecType: this.parseSelected<IntType>(intRec),
      prescribedIntRecValueL: this.parseValue(intRec),
      prescribedIntRecValueR: this.parseValue(intRec),
      intRecValueL: null,
      intRecValueR: null,
    };
  }

  private calculateIntValues(
    paramValues: AttributeValue[],
    bodyweight: number,
    workloads: Workload[],
  ): Pick<
    Workload,
    | 'prescribedIntWork1ValueL'
    | 'prescribedIntWork1ValueR'
    | 'prescribedIntWork2ValueL'
    | 'prescribedIntWork2ValueR'
  > {
    const intWork1 = paramValues.find((p) => p.field === ParamType.IntWork1);
    const intWork1Field = this.parseSelected<IntType>(intWork1);
    const intWork1Value = this.parseValue(intWork1);

    const intWork2 = paramValues.find((p) => p.field === ParamType.IntWork2);
    const intWork2Field = this.parseSelected<IntType>(intWork2);
    const intWork2Value = this.parseValue(intWork2);

    const prescribedIntWork1Value = isNaN(intWork1Value)
      ? undefined
      : intWork1Field === IntType.Rm && !isNaN(intWork1Value)
        ? this.calculateRM(intWork1Value, workloads)
        : intWork1Field === IntType.Bw && !isNaN(intWork1Value)
          ? bodyweight * this.commonService.number.percent(intWork1Value)
          : [IntType.Mas, IntType.Hrmax].includes(intWork1Field) &&
              !isNaN(intWork1Value)
            ? this.commonService.number.percent(intWork1Value)
            : intWork1Value;

    const prescribedIntWork2Value = isNaN(intWork1Value)
      ? undefined
      : intWork2Field === IntType.Rm && !isNaN(intWork2Value)
        ? this.calculateRM(intWork2Value, workloads)
        : intWork2Field === IntType.Bw && !isNaN(intWork2Value)
          ? bodyweight * this.commonService.number.percent(intWork2Value)
          : [IntType.Mas, IntType.Hrmax].includes(intWork2Field) &&
              !isNaN(intWork1Value)
            ? this.commonService.number.percent(intWork2Value)
            : intWork2Value;

    return {
      prescribedIntWork1ValueL: prescribedIntWork1Value,
      prescribedIntWork1ValueR: prescribedIntWork1Value,
      prescribedIntWork2ValueL: prescribedIntWork2Value,
      prescribedIntWork2ValueR: prescribedIntWork2Value,
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
