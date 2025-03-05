import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';
import { Query } from 'firebase-admin/lib/firestore';
import { FirestoreEntity, Update } from 'src/common/type/entity.type';
import { Wrapper } from 'src/common/type/wrapper.type';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  FirestoreCollectionRepository,
  TrainingRef,
  TrainingStatusRef,
} from '../../common/type/firestore.type';
import { TrainingStatus } from '../entity/training-status.entity';
import { SetStatus } from '../enum/set-status.enum';
import { TrainingRepository } from './training.repository';

@Injectable()
export class TrainingStatusRepository
  implements FirestoreCollectionRepository<TrainingStatus, TrainingRef>
{
  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => TrainingRepository))
    private readonly trainingRepository: Wrapper<TrainingRepository>,
  ) {}

  getKey(ref: TrainingStatusRef): string {
    return `${ref.userId}-${ref.componentId}`;
  }

  async getDocs(
    ref: TrainingRef,
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<TrainingStatus[]> {
    const snapshot = await query(this.collection(ref)).get();

    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(
        doc.data() as FirestoreEntity<TrainingStatus>,
      ),
    );
  }

  async getDoc(ref: TrainingStatusRef): Promise<TrainingStatus | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<TrainingStatus>,
    );
  }

  async addDoc(ref: TrainingStatusRef) {
    const query = this.firebaseService.buildCreateQuery<TrainingStatus>(
      {
        userId: ref.userId,
        trainingId: ref.trainingId,
        componentId: ref.componentId,
        status: SetStatus.DONE,
      },
      { timestamps: true },
    );

    await this.doc(ref).set(query);
    return ref.userId;
  }

  async updateDoc(ref: TrainingStatusRef, data: Update<TrainingStatus>) {
    const query = this.firebaseService.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async deleteDoc(ref: TrainingStatusRef) {
    await this.doc(ref).delete();
  }

  doc(ref: TrainingStatusRef): DocumentReference {
    return this.collection(ref).doc(this.getKey(ref));
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(FirestoreCollection.TRAINING_STATUS);
  }
}
