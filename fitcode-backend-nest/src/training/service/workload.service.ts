import { BadRequestException, Injectable } from '@nestjs/common';
import { CollectionGroup } from 'firebase-admin/firestore';

import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { TimestampEntity } from '@src/common/entity/timestamp.entity';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { FirestoreEntity } from '@src/common/type/entity.type';
import {
  BatchWriteOperation,
  CycleRef,
  ExerciseRef,
  GroupRef,
  InstitutionRef,
  TrainingComponentRef,
  UserRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { PARAMS } from '@src/component/constant/param.constant';
import { IntType, ParamType, VolType } from '@src/component/enum/param.enum';
import { FirebaseService } from '@src/firebase/firebase.service';

import { CompletedTrainingExercise } from '../entity/completed-training.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { Workload } from '../entity/workload.entity';
import {
  CompletedWorkload,
  PrescribedWorkload,
  WorkloadValue,
} from '../entity/workload-value.entity';
import { SetStatus } from '../enum/set-status.enum';
import { WorkloadRepository } from '../repository/workload.repository';
import { TrainingPlanService } from './training-plan.service';

@Injectable()
export class WorkloadService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly repository: WorkloadRepository,
    private readonly trainingPlanService: TrainingPlanService,
  ) {}

  getDoc(id: WorkloadRef) {
    return this.repository.doc(id);
  }

  collection(trainingId: string) {
    return this.repository.collection({ trainingId });
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

  async findHistory(ref: ExerciseRef & { userId: string }) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('userId', '==', ref.userId)
      .where('exerciseId', '==', ref.exerciseId)
      .where('status', 'not-in', [SetStatus.NOT_STARTED, SetStatus.IGNORED])
      .orderBy('intWork1ValueL')
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
    return await this.repository
      .collection({ trainingId })
      .doc(
        this.repository.getKey({
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

  async findAllByTraining(trainingId: string, status?: SetStatus) {
    const query = this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_WORKLOAD)
      .where('trainingId', '==', trainingId);

    const finalQuery = status ? query.where('status', '==', status) : query;

    return await finalQuery
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

    if (ref.memberIds && ref.memberIds.length)
      query = query.where('userId', 'in', ref.memberIds) as CollectionGroup;
    else if (ref.userId)
      query = query.where('userId', '==', ref.userId) as CollectionGroup;

    if (ref.componentId)
      query = query.where(
        'componentId',
        '==',
        ref.componentId,
      ) as CollectionGroup;

    if (ref.exerciseIds && ref.exerciseIds.length)
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
    const collection = this.firebaseService.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );

    return await this.firebaseService.batchIn<Workload>(
      'userId',
      membersIds,
      collection,
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

  async findUnstartedWorkloads(userIds: string[]): Promise<Workload[]> {
    const ref = this.firebaseService.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );

    return await this.firebaseService.batchIn<Workload>(
      'userId',
      userIds,
      ref,
      (q) => q.where('status', '==', SetStatus.NOT_STARTED),
      { batchSize: 15 },
    );
  }

  /**
   * Creates workloads for provided user for training component
   * with completed set data input. It loops through all prescribed
   * values and finds corresponding input exercises and sets that
   * are provided as completed.
   */
  async createForTrainingComponent(
    trainingComponent: TrainingComponent,
    ref: InstitutionRef & CycleRef & TrainingComponentRef & UserRef,
    input: CompletedTrainingExercise[],
  ) {
    // get all exercises for their names in case of error
    const allExercises = await this.trainingPlanService.getAllTrainingExercises(
      [trainingComponent],
    );

    // find prescribed supersets (either from subgroup or main group)
    const subgroup = trainingComponent.subgroups.find((s) =>
      s.membersIds.includes(ref.uid),
    );

    const prescribedSupersets = subgroup
      ? subgroup.supersets
      : trainingComponent.supersets;

    // TODO - fetch custom workloads in the future and map them to prescribedSupersets

    const collection = this.repository.collection(ref);
    const operations: BatchWriteOperation<Workload>[] = [];

    prescribedSupersets.forEach(
      ({ exercises: prescribedExercises }, supersetIndex) => {
        prescribedExercises.forEach((prescribedExercise) => {
          const exerciseName = allExercises.find(
            (e) => e.id === prescribedExercise.id,
          )?.name;

          const completedExercise = input.find(
            (e) =>
              e.id === prescribedExercise.id &&
              e.supersetIndex === supersetIndex,
          );

          if (!completedExercise)
            throw new BadRequestException(
              `You have to complete prescribed exercise ${exerciseName} in superset ${supersetIndex + 1}`,
            );

          prescribedExercise.sets.forEach((prescribedSet) => {
            const prescribedWorkload =
              this.getPrescribedWorkload(prescribedSet);

            const partialWorkload = {
              institutionId: ref.institutionId,
              groupId: ref.groupId,
              cycleId: ref.cycleId,
              userId: ref.uid,
              trainingId: ref.trainingId,
              componentId: ref.componentId,
              exerciseId: prescribedExercise.id,
              setNumber: prescribedSet.setNumber,
              plannedAt: trainingComponent.from,
              isCustom: false,
              notes: '',
            };

            const completedSet = completedExercise.sets.find(
              (set) => set.setNumber === prescribedSet.setNumber,
            );

            if (!completedSet)
              // create workload with status IGNORED and no completed values
              operations.push({
                operation: 'set',
                ref: collection.doc(),
                data: this.firebaseService.buildCreateQuery({
                  ...partialWorkload,
                  ...prescribedWorkload,
                  status: SetStatus.IGNORED,
                }),
              });
            else {
              const { added, removed } = this.commonService.array.diff(
                prescribedSet.paramValuesL.map((p) => p.field),
                completedSet.paramValuesL.map((p) => p.field),
              );

              // throw error for all added or removed fields
              if (added.length)
                this.checkParamDifference(added, 'complete', {
                  prescribedSet,
                  exerciseName,
                  supersetIndex,
                });

              if (removed.length)
                this.checkParamDifference(removed, 'remove', {
                  prescribedSet,
                  exerciseName,
                  supersetIndex,
                });

              const completedWorkload = this.getCompletedWorkload(completedSet);
              const workloadValue: WorkloadValue = {
                ...prescribedWorkload,
                ...completedWorkload,
              };

              operations.push({
                operation: 'set',
                ref: collection.doc(),
                data: this.firebaseService.buildCreateQuery({
                  ...partialWorkload,
                  ...workloadValue,
                  status: this.getStatus(workloadValue),
                }),
              });
            }
          });
        });
      },
    );

    const batch = this.firebaseService.firestore.batch();
    operations.forEach((op) => {
      const { operation, ref, data } = op;
      if (operation === 'set') batch.set(ref, data, { merge: true });
      else if (operation === 'update') batch.update(ref, data);
    });

    const results = await batch.commit();
    return results.length; // return number of operations committed
    // return await this.firebaseService.paginateBatchWrites(operations);
  }

  async deleteWorkloads(workloads: Workload[]): Promise<void> {
    const refs = workloads.map((w) => ({
      trainingId: w.trainingId,
      componentId: w.componentId,
      exerciseId: w.exerciseId,
      setNumber: w.setNumber,
      userId: w.userId,
    }));

    await this.repository.deleteDocs(refs);
  }

  getStatus(workloadValue: WorkloadValue): SetStatus {
    const volWork1Status = this.getStatusByField(
      workloadValue.prescribedVolWork1ValueL,
      workloadValue.volWork1ValueL,
    );

    const volWork2Status = this.getStatusByField(
      workloadValue.prescribedVolWork2ValueL,
      workloadValue.volWork2ValueL,
    );

    const volRecStatus = this.getStatusByField(
      workloadValue.prescribedVolRecValueL,
      workloadValue.volRecValueL,
    );

    const intWork1Status = this.getStatusByField(
      workloadValue.prescribedIntWork1ValueL,
      workloadValue.intWork1ValueL,
    );

    const intWork2Status = this.getStatusByField(
      workloadValue.prescribedIntWork2ValueL,
      workloadValue.intWork2ValueL,
    );

    const intRecStatus = this.getStatusByField(
      workloadValue.prescribedIntRecValueL,
      workloadValue.intRecValueL,
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
    completedValue?: number,
  ): SetStatus {
    if (prescribedValue === undefined || prescribedValue === null)
      return SetStatus.IGNORED; // field not prescribed, ignore

    if (completedValue === undefined || completedValue === null)
      return SetStatus.NOT_STARTED; // field prescribed, but not performed

    // TODO - currently, this is comparing STRING values, not numbers, so it will be wrong
    if (completedValue < prescribedValue) return SetStatus.PARTIAL; // partial set
    if (completedValue === prescribedValue) return SetStatus.COMPLETED; // completed set
    if (completedValue > prescribedValue) return SetStatus.OVER; // over-completed set
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

  getWorkloadValue(
    prescribedSet: ExerciseSet,
    completedSet: ExerciseSet,
  ): WorkloadValue {
    return {
      ...this.getPrescribedWorkload(prescribedSet),
      ...this.getCompletedWorkload(completedSet),
    };
  }

  /**
   * Parses values that athlete completed, so it's assumed that `paramValues`
   * are populated with correct values
   */
  getCompletedWorkload(completedSet: ExerciseSet): CompletedWorkload {
    const { paramValuesL, paramValuesR } = completedSet;

    const volWork1ValueL = paramValuesL.find(
      (p) => p.field === ParamType.VolWork1,
    );

    const volWork1ValueR = paramValuesR.find(
      (p) => p.field === ParamType.VolWork1,
    );

    const volWork2ValueL = paramValuesL.find(
      (p) => p.field === ParamType.VolWork2,
    );

    const volWork2ValueR = paramValuesR.find(
      (p) => p.field === ParamType.VolWork2,
    );

    const volRecValueL = paramValuesL.find(
      (p) => p.field === ParamType.VolRec1,
    );

    const volRecValueR = paramValuesR.find(
      (p) => p.field === ParamType.VolRec1,
    );

    const intWork1ValueL = paramValuesL.find(
      (p) => p.field === ParamType.IntWork1,
    );

    const intWork1ValueR = paramValuesR.find(
      (p) => p.field === ParamType.IntWork1,
    );

    const intWork2ValueL = paramValuesL.find(
      (p) => p.field === ParamType.IntWork2,
    );

    const intWork2ValueR = paramValuesR.find(
      (p) => p.field === ParamType.IntWork2,
    );

    const intRecValueL = paramValuesL.find(
      (p) => p.field === ParamType.IntRec1,
    );

    const intRecValueR = paramValuesR.find(
      (p) => p.field === ParamType.IntRec1,
    );

    return {
      volWork1ValueL: this.parseValue(volWork1ValueL),
      volWork1ValueR: this.parseValue(volWork1ValueR),
      volWork2ValueL: this.parseValue(volWork2ValueL),
      volWork2ValueR: this.parseValue(volWork2ValueR),
      volRecValueL: this.parseValue(volRecValueL),
      volRecValueR: this.parseValue(volRecValueR),
      intWork1ValueL: this.parseValue(intWork1ValueL),
      intWork1ValueR: this.parseValue(intWork1ValueR),
      intWork2ValueL: this.parseValue(intWork2ValueL),
      intWork2ValueR: this.parseValue(intWork2ValueR),
      intRecValueL: this.parseValue(intRecValueL),
      intRecValueR: this.parseValue(intRecValueR),
    };
  }

  getPrescribedWorkload(prescribedSet: ExerciseSet): PrescribedWorkload {
    const { paramValuesL, paramValuesR } = prescribedSet;
    const volWork1L = paramValuesL.find((p) => p.field === ParamType.VolWork1);
    const volWork1R = paramValuesL.find((p) => p.field === ParamType.VolWork1);
    const volWork2L = paramValuesL.find((p) => p.field === ParamType.VolWork2);
    const volWork2R = paramValuesR.find((p) => p.field === ParamType.VolWork2);
    const volRecL = paramValuesL.find((p) => p.field === ParamType.VolRec1);
    const volRecR = paramValuesR.find((p) => p.field === ParamType.VolRec1);
    const intWork1L = paramValuesL.find((p) => p.field === ParamType.IntWork1);
    const intWork1R = paramValuesR.find((p) => p.field === ParamType.IntWork1);
    const intWork2L = paramValuesL.find((p) => p.field === ParamType.IntWork2);
    const intWork2R = paramValuesR.find((p) => p.field === ParamType.IntWork2);
    const intRecL = paramValuesL.find((p) => p.field === ParamType.IntRec1);
    const intRecR = paramValuesR.find((p) => p.field === ParamType.IntRec1);

    return {
      volWork1Type: this.parseSelected<VolType>(volWork1L),
      prescribedVolWork1ValueL: this.parseValue(volWork1L) as number,
      prescribedVolWork1ValueR: this.parseValue(volWork1R) as number,
      volWork2Type: this.parseSelected<VolType>(volWork2L),
      prescribedVolWork2ValueL: this.parseValue(volWork2L) as number,
      prescribedVolWork2ValueR: this.parseValue(volWork2R) as number,
      volRecType: this.parseSelected<VolType>(volRecL),
      prescribedVolRecValueL: this.parseValue(volRecL) as number,
      prescribedVolRecValueR: this.parseValue(volRecR) as number,
      intWork1Type: this.parseSelected<IntType>(intWork1L),
      prescribedIntWork1ValueL: this.parseValue(intWork1L),
      prescribedIntWork1ValueR: this.parseValue(intWork1R),
      intWork2Type: this.parseSelected<IntType>(intWork2L),
      prescribedIntWork2ValueL: this.parseValue(intWork2L),
      prescribedIntWork2ValueR: this.parseValue(intWork2R),
      intRecType: this.parseSelected<IntType>(intRecL),
      prescribedIntRecValueL: this.parseValue(intRecL),
      prescribedIntRecValueR: this.parseValue(intRecR),
    };
  }

  calculateIntValues(
    paramValues: AttributeValue[],
    bodyweight: number,
    history: Workload[],
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
        ? this.calculateRM(intWork1Value, history)
        : intWork1Field === IntType.Bw && !isNaN(intWork1Value)
          ? bodyweight * this.commonService.number.percent(intWork1Value)
          : [IntType.Mas, IntType.Hrmax].includes(intWork1Field) &&
              !isNaN(intWork1Value)
            ? this.commonService.number.percent(intWork1Value)
            : intWork1Value;

    const prescribedIntWork2Value = isNaN(intWork1Value)
      ? undefined
      : intWork2Field === IntType.Rm && !isNaN(intWork2Value)
        ? this.calculateRM(intWork2Value, history)
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

  private checkParamDifference(
    fields: string[],
    action: 'complete' | 'remove',
    input: {
      prescribedSet: ExerciseSet;
      exerciseName: string;
      supersetIndex: number;
    },
  ) {
    const { prescribedSet, exerciseName, supersetIndex } = input;

    for (const field of fields) {
      const param = PARAMS.find((p) => p.field === field);
      const selectedField = prescribedSet.paramValuesL.find(
        (p) => p.field === field,
      )?.selected;

      if (!param || !selectedField) continue;

      const selected = param.options?.find(
        (o) => o.field === selectedField.split(':')[0],
      );

      if (!selected) continue;

      const paramName = (param.description || param.name).toLowerCase();
      const selectedName = (
        selected.description || selected.name
      ).toLowerCase();

      throw new BadRequestException(
        `You have to ${action} parameter ${paramName} (${selectedName}) in exercise ${exerciseName} in superset ${supersetIndex + 1}`,
      );
    }
  }
}
