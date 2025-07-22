import { BadRequestException, Injectable } from '@nestjs/common';
import { CollectionGroup } from 'firebase-admin/firestore';

import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
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
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';

import { CreatePrescribedWorkloadDto } from '../dto/create-workload.dto';
import { CompletedTrainingExercise } from '../entity/completed-training.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Workload, WorkloadMeta } from '../entity/workload.entity';
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
    private readonly exerciseService: ExerciseService,
  ) {}

  getDoc(id: WorkloadRef) {
    return this.repository.doc(id);
  }

  collection(trainingId: string) {
    return this.repository.collection({ trainingId });
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

  /**
   * Finds all workloads for training (normally training to be planned,
   * in the future). It will return all workloads that have been
   * created for athletes as custom workload values that must be
   * completed separately, not depending on the main group or
   * subgroup prescribed training.
   */
  async findAllCustomByTraining(trainingId: string): Promise<Workload[]> {
    const query = this.collection(trainingId).where(
      'status',
      '==',
      SetStatus.NOT_STARTED,
    );

    const snapshot = await query.get();
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Workload>),
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

    // custom workloads in the future that are already prescribed (and none of them is completed),
    // that's why we can enforce type of (WorkloadMeta & PrescribedWorkload)[]
    const customPrescribedWorkloads: (WorkloadMeta & PrescribedWorkload)[] =
      await this.findAllByRef({
        trainingId: ref.trainingId,
        componentId: ref.componentId,
        userId: ref.uid,
      });

    // find prescribed supersets (either from subgroup or main group)
    const subgroup = trainingComponent.subgroups.find((s) =>
      s.membersIds.includes(ref.uid),
    );

    const prescribedSupersets = subgroup
      ? subgroup.supersets
      : trainingComponent.supersets;

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
            const key = this.repository.getKey({
              trainingId: ref.trainingId,
              componentId: ref.componentId,
              exerciseId: prescribedExercise.id,
              supersetIndex,
              setNumber: prescribedSet.setNumber,
              userId: ref.uid,
            });

            const customPrescribedWorkload = customPrescribedWorkloads.find(
              (w) =>
                w.componentId === ref.componentId &&
                w.exerciseId === prescribedExercise.id &&
                w.supersetIndex === supersetIndex &&
                w.setNumber === prescribedSet.setNumber &&
                w.userId === ref.uid,
            );

            const prescribedWorkload = customPrescribedWorkload
              ? customPrescribedWorkload
              : this.getPrescribedWorkload(prescribedSet);

            const workloadMeta: WorkloadMeta = {
              id: key,
              institutionId: ref.institutionId,
              groupId: ref.groupId,
              cycleId: ref.cycleId,
              userId: ref.uid,
              trainingId: ref.trainingId,
              componentId: ref.componentId,
              exerciseId: prescribedExercise.id,
              setNumber: prescribedSet.setNumber,
              supersetIndex,
              plannedAt: trainingComponent.from,
              status: SetStatus.IGNORED,
              notes: '',
            };

            const completedSet = completedExercise.sets.find(
              (set) => set.setNumber === prescribedSet.setNumber,
            );

            if (!completedSet)
              // create workload with status IGNORED and no completed values
              operations.push({
                operation: 'set',
                ref: collection.doc(key),
                data: this.firebaseService.buildCreateQuery({
                  ...workloadMeta,
                  ...prescribedWorkload,
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
                ref: collection.doc(key),
                data: this.firebaseService.buildCreateQuery({
                  ...workloadMeta,
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
      supersetIndex: w.supersetIndex,
      setNumber: w.setNumber,
      userId: w.userId,
    }));

    await this.repository.deleteDocs(refs);
  }

  async validateWorkloads(
    trainingId: string,
    customWorkloads: CreatePrescribedWorkloadDto[],
    trainingComponents: TrainingComponent[],
  ): Promise<Create<Workload>[]> {
    if (!customWorkloads || !customWorkloads.length) return;

    const allExercises = await this.exerciseService.getAll();

    const workloads: Create<Workload>[] = [];
    for (const customWorkload of customWorkloads) {
      // provided workload component must exist in training components
      const trainingComponent = trainingComponents.find(
        (c) => c.id === customWorkload.componentId,
      );

      if (!trainingComponent)
        throw new BadRequestException('Invalid component provided in workload');

      const exercise = allExercises.find(
        (e) => e.id === customWorkload.exerciseId,
      );

      if (!exercise) throw new BadRequestException(`Exercise does not exist`);

      // find prescribed supersets (either from subgroup or main group)
      const subgroup = trainingComponent.subgroups.find((s) =>
        s.membersIds.includes(customWorkload.userId),
      );

      const prescribedSupersets = subgroup
        ? subgroup.supersets
        : trainingComponent.supersets;

      // ensure that workload exercise exists in prescribed supersets
      // find exercise by same id and superset index must also match
      const prescribedExercises: (TrainingExercise & {
        supersetIndex: number;
      })[] = prescribedSupersets.flatMap((s, supersetIndex) =>
        s.exercises.map((e) => ({ ...e, supersetIndex })),
      );

      const prescribedExercise = prescribedExercises.find(
        (e) =>
          e.id === customWorkload.exerciseId &&
          e.supersetIndex === customWorkload.supersetIndex,
      );

      if (!prescribedExercise)
        throw new BadRequestException(
          `Exercise ${exercise.name} is not prescribed in superset ${
            customWorkload.supersetIndex + 1
          }`,
        );

      // ensure that all prescribed values are present in workload
      const prescribedSet = prescribedExercise.sets.find(
        (s) => s.setNumber === customWorkload.setNumber,
      );

      if (!prescribedSet)
        throw new BadRequestException(
          `Set number ${customWorkload.setNumber} is invalid for exercise ${exercise.name}`,
        );

      // ensure that all custom workload values are present in prescribed set
      const prescribedFields = prescribedSet.paramValuesL.map((p) => p.field);
      const customFields = this.getFieldsFromWorkload(customWorkload);
      const { added, removed } = this.commonService.array.diff(
        prescribedFields,
        customFields,
      );

      if (added.length)
        this.checkParamDifference(added, 'complete', {
          prescribedSet,
          exerciseName: exercise.name,
          supersetIndex: customWorkload.supersetIndex,
        });

      if (removed.length)
        this.checkParamDifference(removed, 'remove', {
          prescribedSet,
          exerciseName: exercise.name,
          supersetIndex: customWorkload.supersetIndex,
        });

      // ensure that all prescribed value types have correct values
      for (const field of prescribedFields)
        this.validateFieldValue(field as ParamType, customWorkload);

      workloads.push({
        id: null,
        ...customWorkload,
        status: SetStatus.NOT_STARTED, // meaning custom for user
        plannedAt: trainingComponent.from,
        trainingId,
      });
    }

    return workloads;
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
    const volWork1R = paramValuesR.find((p) => p.field === ParamType.VolWork1);
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

  getExerciseSet(workload: Workload) {
    const set: ExerciseSet = {
      setNumber: workload.setNumber,
      paramValuesL: [],
      paramValuesR: [],
    };

    if (workload.volWork1Type) {
      set.paramValuesL.push({
        field: ParamType.VolWork1,
        value: workload.prescribedVolWork1ValueL?.toString(),
        selected: workload.volWork1Type,
      });

      set.paramValuesR.push({
        field: ParamType.VolWork1,
        value: workload.prescribedVolWork1ValueR?.toString(),
        selected: workload.volWork1Type,
      });
    }

    if (workload.volWork2Type) {
      set.paramValuesL.push({
        field: ParamType.VolWork2,
        value: workload.prescribedVolWork2ValueL?.toString(),
        selected: workload.volWork2Type,
      });

      set.paramValuesR.push({
        field: ParamType.VolWork2,
        value: workload.prescribedVolWork2ValueR?.toString(),
        selected: workload.volWork2Type,
      });
    }

    if (workload.volRecType) {
      set.paramValuesL.push({
        field: ParamType.VolRec1,
        value: workload.prescribedVolRecValueL?.toString(),
        selected: workload.volRecType,
      });

      set.paramValuesR.push({
        field: ParamType.VolRec1,
        value: workload.prescribedVolRecValueR?.toString(),
        selected: workload.volRecType,
      });
    }

    if (workload.intWork1Type) {
      set.paramValuesL.push({
        field: ParamType.IntWork1,
        value: workload.prescribedIntWork1ValueL?.toString(),
        selected: workload.intWork1Type,
      });

      set.paramValuesR.push({
        field: ParamType.IntWork1,
        value: workload.prescribedIntWork1ValueR?.toString(),
        selected: workload.intWork1Type,
      });
    }

    if (workload.intWork2Type) {
      set.paramValuesL.push({
        field: ParamType.IntWork2,
        value: workload.prescribedIntWork2ValueL?.toString(),
        selected: workload.intWork2Type,
      });

      set.paramValuesR.push({
        field: ParamType.IntWork2,
        value: workload.prescribedIntWork2ValueR?.toString(),
        selected: workload.intWork2Type,
      });
    }

    if (workload.intRecType) {
      set.paramValuesL.push({
        field: ParamType.IntRec1,
        value: workload.prescribedIntRecValueL?.toString(),
        selected: workload.intRecType,
      });

      set.paramValuesR.push({
        field: ParamType.IntRec1,
        value: workload.prescribedIntRecValueR?.toString(),
        selected: workload.intRecType,
      });
    }

    return set;
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

      if (!param) continue;
      const paramName = (param.description || param.name).toLowerCase();

      if (!selectedField)
        throw new BadRequestException(
          `Parameter ${paramName} is not prescribed in exercise ${exerciseName} in superset ${supersetIndex + 1}`,
        );

      const selected = param.options?.find(
        (o) => o.field === selectedField.split(':')[0],
      );

      if (!selected) continue;

      const selectedName = (
        selected.description || selected.name
      ).toLowerCase();

      throw new BadRequestException(
        `You have to ${action} parameter ${paramName} (${selectedName}) in exercise ${exerciseName} in superset ${supersetIndex + 1}`,
      );
    }
  }

  private getFieldsFromWorkload(workload: PrescribedWorkload): ParamType[] {
    const fields: ParamType[] = [];

    if (workload.volWork1Type) fields.push(ParamType.VolWork1);
    if (workload.volWork2Type) fields.push(ParamType.VolWork2);
    if (workload.volRecType) fields.push(ParamType.VolRec1);
    if (workload.intWork1Type) fields.push(ParamType.IntWork1);
    if (workload.intWork2Type) fields.push(ParamType.IntWork2);
    if (workload.intRecType) fields.push(ParamType.IntRec1);

    return fields;
  }

  private validateFieldValue(
    paramType: ParamType,
    prescribedWorkload: PrescribedWorkload,
  ) {
    let field: ParamType;

    switch (paramType) {
      case ParamType.VolWork1:
        if (
          prescribedWorkload.prescribedVolWork1ValueL === undefined ||
          prescribedWorkload.prescribedVolWork1ValueL < 0
        )
          field = paramType;
        break;
      case ParamType.VolWork2:
        if (
          prescribedWorkload.prescribedVolWork2ValueL === undefined ||
          prescribedWorkload.prescribedVolWork2ValueL < 0
        )
          field = paramType;
        break;
      case ParamType.VolRec1:
        if (
          prescribedWorkload.prescribedVolRecValueL === undefined ||
          prescribedWorkload.prescribedVolRecValueL < 0
        )
          field = paramType;
        break;
      case ParamType.IntWork1:
        if (
          prescribedWorkload.prescribedIntWork1ValueL === undefined ||
          prescribedWorkload.prescribedIntWork1ValueL < 0
        )
          field = paramType;
        break;
      case ParamType.IntWork2:
        if (
          prescribedWorkload.prescribedIntWork2ValueL === undefined ||
          prescribedWorkload.prescribedIntWork2ValueL < 0
        )
          field = paramType;
        break;
      case ParamType.IntRec1:
        if (
          prescribedWorkload.prescribedIntRecValueL === undefined ||
          prescribedWorkload.prescribedIntRecValueL < 0
        )
          field = paramType;
        break;
    }

    if (field) {
      const name = PARAMS.find((p) => p.field === field)?.description;
      throw new BadRequestException(
        `Prescribed ${name} value must not be empty`,
      );
    }
  }
}
