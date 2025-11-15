import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { endOfDay, startOfDay } from 'date-fns';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';
import { Query } from 'firebase-admin/lib/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  TrainingComponentUserStatusRef,
  TrainingRef,
} from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { TrainingRepository } from '@src/training/repository/training.repository';

import { TrainingComponentUserStatus } from '../entity/training-component-user-status.entity';
import { TrainingStatus } from '../enum/training-status.enum';
import {
  GroupTrainingReportItem,
  UserTrainingRealizationReportItem,
} from '../type/training-report.type';

@Injectable()
export class TrainingComponentUserStatusRepository extends FirestoreRepository<
  TrainingComponentUserStatus,
  TrainingComponentUserStatusRef
> {
  collectionName = FirestoreCollection.TRAINING_COMPONENT_USER_STATUS;

  constructor(
    readonly firebase: FirebaseService,
    @Inject(forwardRef(() => TrainingRepository))
    private readonly trainingRepository: Wrapper<TrainingRepository>,
  ) {
    super(firebase);
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(this.collectionName);
  }

  collectionGroup(): CollectionGroup {
    return this.firebase.firestore.collectionGroup(this.collectionName);
  }

  doc(ref: TrainingComponentUserStatusRef): DocumentReference {
    return this.collection(ref).doc(this.getKey(ref));
  }

  getCreateQuery(data: Create<TrainingComponentUserStatus>) {
    return this.firebase.buildCreateQuery<TrainingComponentUserStatus>(data, {
      timestamps: true,
    });
  }

  async getAllDocs(
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<TrainingComponentUserStatus[]> {
    const snapshot = await query(this.collectionGroup()).get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(
        doc.data() as FirestoreEntity<TrainingComponentUserStatus>,
      ),
    );
  }

  async getAllByTraining(
    trainingId: string,
  ): Promise<TrainingComponentUserStatus[]> {
    const snapshot = await this.collection({ trainingId }).get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(
        doc.data() as FirestoreEntity<TrainingComponentUserStatus>,
      ),
    );
  }

  async getAllForUserToday(
    userId: string,
    filter: { institutionId?: string },
  ): Promise<TrainingComponentUserStatus[]> {
    let q = this.collectionGroup().where('userId', '==', userId);
    if (filter?.institutionId)
      q = q.where('institutionId', '==', filter.institutionId);

    const snapshot = await q.get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(
        doc.data() as FirestoreEntity<TrainingComponentUserStatus>,
      ),
    );
  }

  /**
   * Athlete can have multiple active trainings in database. Valid active trainings
   * are only those that are on the current day. If there are multiple active
   * trainings for the current day, return the one that was started the earliest.
   */
  async getActiveTrainingId(athleteId: string): Promise<string | null> {
    const snapshot = await this.collectionGroup()
      .where('userId', '==', athleteId)
      .where('status', 'in', [
        TrainingStatus.IN_PROGRESS,
        TrainingStatus.PAUSED,
      ])
      .where('from', '>=', Timestamp.fromDate(startOfDay(new Date())))
      .where('from', '<=', Timestamp.fromDate(endOfDay(new Date())))
      .get();

    if (snapshot.empty) return null;

    const active = snapshot.docs.map((doc) =>
      this.firebase.serialize(
        doc.data() as FirestoreEntity<TrainingComponentUserStatus>,
      ),
    );

    return active.sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    )[0].trainingId;
  }

  async findAllByUserTraining(
    userId: string,
    trainingId: string,
  ): Promise<TrainingComponentUserStatus[]> {
    const snapshot = await this.collection({ trainingId })
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map((doc) =>
      this.firebase.serialize(
        doc.data() as FirestoreEntity<TrainingComponentUserStatus>,
      ),
    );
  }

  async save(data: Create<TrainingComponentUserStatus>) {
    const ref: TrainingComponentUserStatusRef = {
      trainingId: data.trainingId,
      componentId: data.componentId,
      uid: data.userId,
    };

    const query =
      this.firebase.buildCreateQuery<TrainingComponentUserStatus>(data);

    const id = this.getKey(ref);
    await this.doc(ref).set({ ...query, id });
    return id;
  }

  async update(
    ref: TrainingComponentUserStatusRef,
    data: Update<TrainingComponentUserStatus>,
  ) {
    const query = this.firebase.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async addPhotos(ref: TrainingComponentUserStatusRef, photoURLs: string[]) {
    if (!photoURLs?.length) return;
    await this.doc(ref).update({
      photoURLs: FieldValue.arrayUnion(...photoURLs) as unknown as string[],
    });
  }

  async delete(ref: TrainingComponentUserStatusRef) {
    await this.doc(ref).delete();
  }

  async deleteAllByTraining(trainingId: string) {
    await this.firebase.firestore.recursiveDelete(
      this.collection({ trainingId }),
    );
  }

  async getGroupReport(
    groupId: string,
    componentId?: string,
  ): Promise<Record<string, GroupTrainingReportItem>> {
    let query = this.collectionGroup().where('groupId', '==', groupId);
    if (componentId) query = query.where('componentId', '==', componentId);

    const snapshot = await query.get();
    const statuses = snapshot.docs.map((doc) =>
      this.firebase.serialize(
        doc.data() as FirestoreEntity<TrainingComponentUserStatus>,
      ),
    );

    // group by userId and the number of unique trainingIds they have
    const attendance: Record<string, Set<string>> = {};
    const realizationAcc: Record<string, { sum: number; count: number }> = {};

    for (const status of statuses) {
      if (status.status !== TrainingStatus.COMPLETED) continue;

      if (!attendance[status.userId]) attendance[status.userId] = new Set();
      attendance[status.userId].add(status.trainingId);

      if (!realizationAcc[status.userId])
        realizationAcc[status.userId] = { sum: 0, count: 0 };

      // if componentId is filtered → use exactly that realization
      // if no componentId → accumulate to compute the average
      realizationAcc[status.userId].sum += status.realization;
      realizationAcc[status.userId].count++;
    }

    // Final output object
    const result: Record<string, GroupTrainingReportItem> = {};
    for (const userId of Object.keys(attendance)) {
      const r = realizationAcc[userId];
      const realization =
        r && r.count > 0 ? Number((r.sum / r.count).toFixed(2)) : 0;

      result[userId] = {
        attended: attendance[userId].size,
        realization,
      };
    }

    return result;
  }

  async getUserTrainingsRealizationReport(
    institutionId: string,
    userId: string,
    componentId?: string,
  ): Promise<UserTrainingRealizationReportItem[]> {
    let query = this.collectionGroup()
      .where('institutionId', '==', institutionId)
      .where('userId', '==', userId);
    if (componentId) query = query.where('componentId', '==', componentId);

    const snapshot = await query.get();
    const statuses = snapshot.docs.map((doc) =>
      this.firebase.serialize(
        doc.data() as FirestoreEntity<TrainingComponentUserStatus>,
      ),
    );

    // realization is the average realization across all components for the training
    const realizationAcc: Record<string, { sum: number; count: number }> = {};
    const trainingMap: Record<string, Date> = {};

    for (const status of statuses) {
      if (status.status !== TrainingStatus.COMPLETED) continue;
      if (!realizationAcc[status.trainingId])
        realizationAcc[status.trainingId] = { sum: 0, count: 0 };

      realizationAcc[status.trainingId].sum += status.realization;
      realizationAcc[status.trainingId].count++;

      if (!trainingMap[status.trainingId])
        trainingMap[status.trainingId] = new Date(status.from);
    }

    // Final output array
    const result: UserTrainingRealizationReportItem[] = [];
    for (const trainingId of Object.keys(realizationAcc)) {
      const r = realizationAcc[trainingId];
      const realization =
        r && r.count > 0 ? Number((r.sum / r.count).toFixed(2)) : 0;

      result.push({
        trainingId,
        from: trainingMap[trainingId],
        to: trainingMap[trainingId],
        realization,
      });
    }

    result.sort((a, b) => a.from.getTime() - b.from.getTime());
    return result;
  }

  getKey(ref: TrainingComponentUserStatusRef) {
    return `${ref.trainingId}-${ref.componentId}-${ref.uid}`;
  }
}
