import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { differenceInSeconds } from 'date-fns';
import { CollectionGroup, Query } from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import {
  CycleRef,
  ExerciseRef,
  InstitutionRef,
  TrainingComponentUserStatusRef,
  TrainingRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import { Training } from '@src/training/entity/training.entity';
import {
  CreateWorkload,
  Workload,
  WorkloadMeta,
} from '@src/training/entity/workload.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';

import { TrainingStatus } from '../enum/training-status.enum';
import { TrainingComponentUserStatusRepository } from '../repository/training-component-user-status.repository';
import { WorkloadRepository } from '../repository/workload.repository';

@Injectable()
export class WorkloadService {
  constructor(
    private readonly common: CommonService,
    private readonly firebase: FirebaseService,
    private readonly repository: WorkloadRepository,
    private readonly trainingComponentUserStatusRepository: TrainingComponentUserStatusRepository,
  ) {}

  getDoc(id: WorkloadRef) {
    return this.repository.doc(id);
  }

  async findExerciseMax(userId: string, exerciseId: string, range?: number) {
    return await this.repository.findExerciseMax(userId, exerciseId, range);
  }

  async getDocs(
    ref: TrainingRef,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<Workload[]> {
    const snapshot = await query(this.repository.collection(ref)).get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(doc.data() as FirestoreEntity<Workload>),
    );
  }

  async getAllByTraining(trainingId: string) {
    return await this.repository.findAllByTraining({
      trainingId,
    });
  }

  async getAllByTrainingByUser(
    ref: Pick<WorkloadRef, 'userId' | 'trainingId'>,
  ) {
    return await this.repository.findAllByTrainingByUser(
      ref.trainingId,
      ref.userId,
    );
  }

  collection(trainingId: string) {
    return this.repository.collection({ trainingId });
  }

  async getExerciseReportByUsers(ref: ExerciseRef & { userIds: string[] }) {
    return await this.firebase.batchIn<Workload>(
      'userId',
      ref.userIds,
      this.firebase.firestore.collectionGroup(
        FirestoreCollection.TRAINING_WORKLOAD,
      ),
      (q) => q.where('exerciseId', '==', ref.exerciseId),
    );
  }

  /**
   * Fetch all workloads by provided refs. For example, if only groupId is provided, then it will
   * fetch all workloads for a specific group (for all trainings, users, ...). If groupId and
   * userId is provided, then workloads for only one user for the whole group will be fetched and
   * so on.
   */
  async findAllByUserTraining(
    ref: Partial<
      InstitutionRef &
        Pick<
          WorkloadRef,
          'userId' | 'trainingId' | 'componentId' | 'exerciseId'
        >
    >,
  ): Promise<Workload[]> {
    const { institutionId, userId, trainingId, componentId, exerciseId } = ref;
    let query = this.firebase.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );

    if (institutionId)
      query = query.where(
        'institutionId',
        '==',
        institutionId,
      ) as CollectionGroup;

    if (userId) query = query.where('userId', '==', userId) as CollectionGroup;
    if (trainingId)
      query = query.where('trainingId', '==', trainingId) as CollectionGroup;
    if (componentId)
      query = query.where('componentId', '==', componentId) as CollectionGroup;
    if (exerciseId)
      query = query.where('exerciseId', '==', exerciseId) as CollectionGroup;

    return query
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebase.serialize(doc.data() as FirestoreEntity<Workload>),
        ),
      );
  }

  async findAllByUserTrainingIds(
    userId: string,
    trainingIds: string[],
  ): Promise<Workload[]> {
    const collection = this.firebase.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );

    return await this.firebase.batchIn<Workload>(
      'trainingId',
      trainingIds,
      collection,
      (q) => q.where('userId', '==', userId),
    );
  }

  async upsert(
    ref: WorkloadRef & CycleRef & InstitutionRef,
    prescribed: ExerciseSet,
    completed: CreateWorkload,
  ) {
    const setNumber = ref.setNumber;
    const workloadMeta: WorkloadMeta = {
      ...ref,
      id: this.repository.getKey(ref),
      status: this.getStatus(prescribed, { ...completed, setNumber }),
      notes: completed.notes,
    };

    const workload: Create<Workload> = {
      ...workloadMeta,
      ...completed,
      prescribed,
      recTime: 0,
    };

    const workloads = await this.findAllByUserTraining({
      institutionId: ref.institutionId,
      userId: ref.userId,
      trainingId: ref.trainingId,
    });

    await this.updateRecoveryTime(workload, ref, workloads);

    const existing = await this.repository.findById(ref);
    if (existing) {
      delete workload.from;
      delete workload.to;
      delete workload.recTime;

      await this.repository.update(ref, workload);
      return { ...existing, ...workload, updatedAt: new Date() };
    }

    await this.repository.save(ref, workload);
    return { ...workload, createdAt: new Date(), updatedAt: new Date() };
  }

  /**
   * Finds next set to be completed for provided exercise in training without
   * actually providing component id, superset index and set number.
   */
  async completeNextSet(
    ref: Pick<WorkloadRef, 'trainingId' | 'exerciseId' | 'userId'>,
    training: Training, // prescribed training for user
    input: CreateWorkload,
  ): Promise<Workload> {
    // find exercise in training
    const existingExerciseWorkloads = await this.findAllByUserTraining(ref);

    // determine in which superset the exercise is being completed and its set number
    let componentId: string;
    let supersetIndex = -1;
    let exerciseIndex = -1;
    let setNumber = -1;
    let prescribedSet: ExerciseSet;

    let remaining = existingExerciseWorkloads.length;
    outer: for (const component of training.components) {
      for (const [i, superset] of component.supersets.entries()) {
        // const found = superset.exercises.find((e) => e.id === ref.exerciseId);
        exerciseIndex = superset.exercises.findIndex(
          (e) => e.id === ref.exerciseId,
        );

        if (exerciseIndex === -1) continue;

        const found = superset.exercises[exerciseIndex];
        for (let j = 0; j < found.sets.length; j++) {
          if (remaining === 0) {
            supersetIndex = i;
            setNumber = j + 1; // 1-based index
            componentId = component.id;
            prescribedSet = found.sets[j];
            break outer;
          }

          remaining--;
        }
      }
    }

    if (supersetIndex === -1 || setNumber === -1) {
      // component & exercise not found, add exercise to special 'other' component
      componentId = 'other';
      supersetIndex = 0;
      setNumber = Math.abs(-remaining - 1); // 1-based index
      prescribedSet = {
        setNumber,
        reps: 1,
        recTime: 0,
      };
    }

    if (componentId !== 'other')
      await this.checkTrainingStatus({
        trainingId: ref.trainingId,
        componentId,
        uid: ref.userId,
      });

    return await this.upsert(
      {
        institutionId: training.institutionId,
        groupId: training.groupId,
        cycleId: training.cycleId,
        componentId,
        supersetIndex,
        setNumber,
        ...ref,
      },
      prescribedSet,
      input,
    );
  }

  /**
   * Upserts provided set as completed for provided workload reference.
   */
  async upsertSet(
    ref: WorkloadRef,
    training: Training,
    input: CreateWorkload,
  ): Promise<Workload> {
    // find prescribed set
    const component = training.components.find((c) => c.id === ref.componentId);
    if (!component)
      throw new BadRequestException('Component not found in training');

    await this.checkTrainingStatus({
      trainingId: ref.trainingId,
      componentId: ref.componentId,
      uid: ref.userId,
    });

    const superset = component.supersets[ref.supersetIndex];
    if (!superset) throw new BadRequestException('Superset not found');

    const prescribedExercise = superset.exercises.find(
      (e) => e.id === ref.exerciseId,
    );

    if (!prescribedExercise)
      throw new BadRequestException('Exercise not found in superset');

    const prescribedSet = prescribedExercise?.sets.find(
      (s) => s.setNumber === ref.setNumber,
    );

    if (!prescribedSet)
      throw new BadRequestException('Set number not found in exercise');

    // fetch previous sets of the same exercise to ensure sequential completion
    const workloads = await this.repository.findAllByTrainingByUser(
      ref.trainingId,
      ref.userId,
    );

    const previousSets = workloads.filter(
      (w) =>
        w.exerciseId === ref.exerciseId &&
        w.componentId === ref.componentId &&
        w.supersetIndex === ref.supersetIndex &&
        w.setNumber < ref.setNumber,
    );

    if (previousSets.length < ref.setNumber - 1)
      throw new ConflictException('Complete previous sets first');

    // create workload
    return await this.upsert(
      {
        ...ref,
        institutionId: training.institutionId,
        groupId: training.groupId,
        cycleId: training.cycleId,
      },
      prescribedSet,
      input,
    );
  }

  async upsertMany(data: Workload[]): Promise<void> {
    const operations: BatchWriteOperation<Workload>[] = data.map((w) => ({
      ref: this.getDoc(w),
      operation: 'set',
      data: this.firebase.buildCreateQuery<Workload>(w),
    }));

    await this.firebase.paginateBatches(operations);
  }

  async checkTrainingStatus(ref: TrainingComponentUserStatusRef) {
    const status =
      await this.trainingComponentUserStatusRepository.findById(ref);

    if (!status || status.status === TrainingStatus.NOT_STARTED)
      throw new ConflictException(
        'Training component has not been started yet',
      );

    if (status.status === TrainingStatus.COMPLETED)
      throw new ConflictException(
        'Training component has already been completed',
      );

    if (status.status === TrainingStatus.PAUSED)
      throw new ConflictException('Training component has been paused');
  }

  getStatus(prescribed: ExerciseSet, completed: ExerciseSet): SetStatus {
    const repsStatus = this.getStatusByField(prescribed.reps, completed.reps);
    const repsRStatus = this.getStatusByField(
      prescribed.repsR,
      completed.repsR,
    );

    const loadKgStatus = this.getStatusByField(
      prescribed.loadKg,
      completed.loadKg,
    );

    const loadKgRStatus = this.getStatusByField(
      prescribed.loadKgR,
      completed.loadKgR,
    );

    const tempoEccStatus = this.getStatusByField(
      prescribed.tempoEcc,
      completed.tempoEcc,
    );

    const tempoIsoStatus = this.getStatusByField(
      prescribed.tempoIso,
      completed.tempoIso,
    );

    const tempoConStatus = this.getStatusByField(
      prescribed.tempoCon,
      completed.tempoCon,
    );

    const tempoIdleStatus = this.getStatusByField(
      prescribed.tempoIdle,
      completed.tempoIdle,
    );

    const tempoEccRStatus = this.getStatusByField(
      prescribed.tempoEccR,
      completed.tempoEccR,
    );

    const tempoIsoRStatus = this.getStatusByField(
      prescribed.tempoIsoR,
      completed.tempoIsoR,
    );

    const tempoConRStatus = this.getStatusByField(
      prescribed.tempoConR,
      completed.tempoConR,
    );

    const tempoIdleRStatus = this.getStatusByField(
      prescribed.tempoIdleR,
      completed.tempoIdleR,
    );

    const velStatus = this.getStatusByField(prescribed.vel, completed.vel);
    const velRStatus = this.getStatusByField(prescribed.velR, completed.velR);

    const effStatus = this.getStatusByField(prescribed.eff, completed.eff);
    const effRStatus = this.getStatusByField(prescribed.effR, completed.effR);

    const recTimeStatus = this.getStatusByField(
      prescribed.recTime,
      completed.recTime,
    );

    const recTimeRStatus = this.getStatusByField(
      prescribed.recTimeR,
      completed.recTimeR,
    );

    const recDistStatus = this.getStatusByField(
      prescribed.recDist,
      completed.recDist,
    );

    const recDistRStatus = this.getStatusByField(
      prescribed.recDistR,
      completed.recDistR,
    );

    const timeStatus = this.getStatusByField(prescribed.time, completed.time);
    const timeRStatus = this.getStatusByField(
      prescribed.timeR,
      completed.timeR,
    );

    const distStatus = this.getStatusByField(prescribed.dist, completed.dist);
    const distRStatus = this.getStatusByField(
      prescribed.distR,
      completed.distR,
    );

    let fieldStatus = [
      repsStatus,
      repsRStatus,
      loadKgStatus,
      loadKgRStatus,
      tempoEccStatus,
      tempoIsoStatus,
      tempoConStatus,
      tempoIdleStatus,
      tempoEccRStatus,
      tempoIsoRStatus,
      tempoConRStatus,
      tempoIdleRStatus,
      velStatus,
      velRStatus,
      effStatus,
      effRStatus,
      recTimeStatus,
      recTimeRStatus,
      recDistStatus,
      recDistRStatus,
      timeStatus,
      timeRStatus,
      distStatus,
      distRStatus,
    ];

    // edge case - no value is prescribed
    if (fieldStatus.every((status) => status === SetStatus.IGNORED))
      return SetStatus.COMPLETED;

    // remove all ignored fields
    fieldStatus = fieldStatus.filter((status) => status !== SetStatus.IGNORED);

    // not started if every performed value is not started
    if (fieldStatus.every((status) => status === SetStatus.NOT_STARTED))
      return SetStatus.NOT_STARTED;

    // partial if atleast one performed value is partial
    if (fieldStatus.some((status) => status === SetStatus.PARTIAL))
      return SetStatus.PARTIAL;

    // no more partial values, so either completed or over
    // if some performed value is over, then it's over
    if (fieldStatus.some((status) => status === SetStatus.OVER))
      return SetStatus.OVER;

    // all performed are completed
    return SetStatus.COMPLETED;
  }

  private getStatusByField(
    prescribedValue?: number,
    completedValue?: number,
  ): SetStatus {
    if (this.common.object.isEmpty(prescribedValue)) return SetStatus.IGNORED; // field not prescribed, ignore
    if (this.common.object.isEmpty(completedValue))
      return SetStatus.NOT_STARTED; // field prescribed, but not performed

    // TODO - currently, this is comparing STRING values, not numbers, so it will be wrong
    if (completedValue < prescribedValue) return SetStatus.PARTIAL; // partial set
    if (completedValue === prescribedValue) return SetStatus.COMPLETED; // completed set
    if (completedValue > prescribedValue) return SetStatus.OVER; // over-completed set
  }

  private async updateRecoveryTime(
    current: Workload,
    ref: Pick<WorkloadRef, 'componentId' | 'exerciseId' | 'supersetIndex'>,
    workloads: Workload[],
  ) {
    // only applies for workloads that match the same component, exercise and superset index
    const filtered = workloads.filter(
      (w) =>
        w.componentId === ref.componentId &&
        w.exerciseId === ref.exerciseId &&
        w.supersetIndex === ref.supersetIndex,
    );

    if (!filtered.length) return; // no need to update recovery time if no workloads

    // find previous set
    const prevSetNumber = current.setNumber - 1;
    if (prevSetNumber < 1) return; // no previous set

    const previousSet = filtered.find((w) => w.setNumber === prevSetNumber);
    if (!previousSet) return; // previous set not found

    // calculate recovery time
    await this.repository.update(previousSet, {
      recTime: differenceInSeconds(current.from, previousSet.to),
    });
  }
}
