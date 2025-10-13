import { BadRequestException, Injectable } from '@nestjs/common';
import { CollectionGroup, Query } from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import {
  CycleRef,
  ExerciseRef,
  InstitutionRef,
  TrainingRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';

import { CreatePrescribedWorkloadDto } from '../dto/create-workload.dto';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import {
  CreateWorkload,
  Workload,
  WorkloadMeta,
} from '../entity/workload.entity';
import { SetStatus } from '../enum/set-status.enum';
import { WorkloadRepository } from '../repository/workload.repository';
import { ExerciseParamService } from './exercise-param.service';
import { TrainingPlanService } from './training-plan.service';

@Injectable()
export class WorkloadService {
  constructor(
    private readonly common: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly repository: WorkloadRepository,
    private readonly exerciseParamService: ExerciseParamService,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly exerciseService: ExerciseService,
  ) {}

  getDoc(id: WorkloadRef) {
    return this.repository.doc(id);
  }

  async getDocs(
    ref: TrainingRef,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<Workload[]> {
    const snapshot = await query(this.repository.collection(ref)).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Workload>),
    );
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
  async findAllByUserTraining(
    userId: string,
    ref: Partial<
      Pick<WorkloadRef, 'trainingId' | 'componentId' | 'exerciseId'>
    >,
  ): Promise<Workload[]> {
    const { trainingId, componentId, exerciseId } = ref;
    let query = this.firebaseService.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );

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
    };

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
    const existingExerciseWorkloads = await this.findAllByUserTraining(
      ref.userId,
      ref,
    );

    // determine in which superset the exercise is being completed and its set number
    let componentId: string;
    let supersetIndex = -1;
    let setNumber = -1;
    let prescribedSet: ExerciseSet;

    let remaining = existingExerciseWorkloads.length;
    outer: for (const component of training.components) {
      for (const [i, superset] of component.supersets.entries()) {
        const found = superset.exercises.find((e) => e.id === ref.exerciseId);
        if (!found) continue;

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
    const component = this.trainingPlanService
      .getTrainingComponents(training)
      .find((c) => c.id === ref.componentId);

    if (!component)
      throw new BadRequestException('Component not found in training');

    const superset = component.supersets[ref.supersetIndex];
    if (!superset) throw new BadRequestException('Superset not found');

    const prescribedExercise = superset.exercises.find(
      (e) => e.id === ref.exerciseId,
    );

    if (!prescribedExercise)
      throw new BadRequestException('Exercise not found in training');

    const prescribedSet = prescribedExercise?.sets.find(
      (s) => s.setNumber === ref.setNumber,
    );

    if (!prescribedSet)
      throw new BadRequestException('Set number not found in exercise');

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

  async deleteWorkloads(workloads: WorkloadMeta[]): Promise<void> {
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
    customWorkloads: CreatePrescribedWorkloadDto[],
    trainingComponents: Pick<
      TrainingComponent,
      'id' | 'supersets' | 'subgroups' | 'from'
    >[],
  ): Promise<Create<Workload>[]> {
    if (!customWorkloads || !customWorkloads.length) return [];

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
    }

    return workloads;
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

    const tempoStatus = this.getStatusByField(
      this.exerciseParamService.tempoToSeconds(prescribed.tempo),
      this.exerciseParamService.tempoToSeconds(completed.tempo),
    );

    const tempoRStatus = this.getStatusByField(
      this.exerciseParamService.tempoToSeconds(prescribed.tempoR),
      this.exerciseParamService.tempoToSeconds(completed.tempoR),
    );

    const velStatus = this.getStatusByField(prescribed.vel, completed.vel);
    const velRStatus = this.getStatusByField(prescribed.velR, completed.velR);
    const effStatus = this.getStatusByField(prescribed.eff, completed.eff);

    const recTimeStatus = this.getStatusByField(
      prescribed.recTime,
      completed.recTime,
    );

    const recDistStatus = this.getStatusByField(
      prescribed.recDist,
      completed.recDist,
    );

    const timeStatus = this.getStatusByField(prescribed.time, completed.time);
    const distStatus = this.getStatusByField(prescribed.dist, completed.dist);

    let fieldStatus = [
      repsStatus,
      repsRStatus,
      loadKgStatus,
      loadKgRStatus,
      tempoStatus,
      tempoRStatus,
      velStatus,
      velRStatus,
      effStatus,
      recTimeStatus,
      recDistStatus,
      timeStatus,
      distStatus,
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
}
