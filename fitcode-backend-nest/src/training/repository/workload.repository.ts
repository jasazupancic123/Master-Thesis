import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';
import { Query } from 'firebase-admin/lib/firestore';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  FirestoreCollectionRepository,
  TrainingRef,
  WorkloadRef,
} from '../../common/type/firestore.type';
import { Workload } from '../entity/workload.entity';
import { TrainingRepository } from './training.repository';

@Injectable()
export class WorkloadRepository
  implements FirestoreCollectionRepository<Workload, TrainingRef>
{
  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => TrainingRepository))
    private readonly trainingRepository: Wrapper<TrainingRepository>,
  ) {}

  async getAllDocs(
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<Workload[]> {
    const snapshot = await query(this.collectionGroup()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Workload>),
    );
  }

  async getDocs(
    ref: TrainingRef,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<Workload[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Workload>),
    );
  }

  async getDoc(ref: WorkloadRef): Promise<Workload | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Workload>,
    );
  }

  async addDoc(ref: WorkloadRef, data: Create<Workload>) {
    const query = this.firebaseService.buildCreateQuery<Workload>(data, {
      timestamps: true,
    });

    this.doc(ref).set(query);
    return this.getKey(ref);
  }

  async updateDoc(ref: WorkloadRef, data: Update<Workload>) {
    const query = this.firebaseService.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async deleteDoc(ref: WorkloadRef) {
    await this.doc(ref).delete();
  }

  async deleteDocs(ref: WorkloadRef[]) {
    const batch = this.firebaseService.firestore.batch();
    ref.forEach((r) => batch.delete(this.doc(r)));
    await batch.commit();
  }

  doc(ref: WorkloadRef): DocumentReference {
    return this.collection(ref).doc(this.getKey(ref));
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(FirestoreCollection.TRAINING_WORKLOAD);
  }

  collectionGroup(): CollectionGroup {
    return this.firebaseService.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );
  }

  getKey(ref: WorkloadRef) {
    return `${ref.trainingId}-${ref.userId}-${ref.componentId}-${ref.exerciseId}-${ref.setNumber}`;
  }
}
