import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
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
import { UserWorkload } from '../entity/user-workload.entity';
import { TrainingRepository } from './training.repository';

@Injectable()
export class UserWorkloadRepository
  implements FirestoreCollectionRepository<UserWorkload, TrainingRef>
{
  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => TrainingRepository))
    private readonly trainingRepository: Wrapper<TrainingRepository>,
  ) {}

  async getDocs(
    ref: TrainingRef,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<UserWorkload[]> {
    const snapshot = await query(this.collection(ref)).get();

    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(
        doc.data() as FirestoreEntity<UserWorkload>,
      ),
    );
  }

  async getDoc(ref: WorkloadRef): Promise<UserWorkload | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<UserWorkload>,
    );
  }

  async addDoc(ref: WorkloadRef, data: Create<UserWorkload>) {
    const query = this.firebaseService.buildCreateQuery<UserWorkload>(data, {
      timestamps: true,
    });

    this.doc(ref).set(query);
    return this.getKey(ref);
  }

  async updateDoc(ref: WorkloadRef, data: Update<UserWorkload>) {
    const query = this.firebaseService.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async deleteDoc(ref: WorkloadRef) {
    await this.doc(ref).delete();
  }

  doc(ref: WorkloadRef): DocumentReference {
    return this.collection(ref).doc(this.getKey(ref));
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(FirestoreCollection.TRAINING_WORKLOAD);
  }

  private getKey(ref: WorkloadRef) {
    return `${ref.trainingId}-${ref.userId}-${ref.componentId}-${ref.exerciseId}`;
  }
}
