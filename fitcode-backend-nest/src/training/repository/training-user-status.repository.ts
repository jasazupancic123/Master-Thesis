import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
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

  async getAllByUser(
    userId: string,
    filter: { institutionId?: string; from?: Date; to?: Date },
  ): Promise<TrainingComponentUserStatus[]> {
    let q = this.collectionGroup().where('userId', '==', userId);
    if (filter?.institutionId)
      q = q.where('institutionId', '==', filter.institutionId);

    if (filter?.from) q = q.where('createdAt', '>=', filter.from);
    if (filter?.to) q = q.where('createdAt', '<=', filter.to);

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
  async getActiveComponents(
    athleteId: string,
  ): Promise<TrainingComponentUserStatus[]> {
    const snapshot = await this.collectionGroup()
      .where('userId', '==', athleteId)
      .where('status', '==', TrainingStatus.IN_PROGRESS)
      .where('createdAt', '>=', Timestamp.fromDate(startOfDay(new Date())))
      .get();

    if (snapshot.empty) return [];

    const active = snapshot.docs.map((doc) =>
      this.firebase.serialize(
        doc.data() as FirestoreEntity<TrainingComponentUserStatus>,
      ),
    );

    return active.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async save(
    data: Create<TrainingComponentUserStatus>,
    ref: TrainingComponentUserStatusRef,
  ) {
    const query = this.firebase.buildCreateQuery<TrainingComponentUserStatus>(
      data,
      { timestamps: true },
    );

    await this.doc(ref).set(query);
    return this.getKey(ref);
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

  getKey(ref: TrainingComponentUserStatusRef) {
    return `${ref.trainingId}-${ref.componentId}-${ref.uid}`;
  }
}
