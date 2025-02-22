import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { Query } from 'firebase-admin/lib/firestore';
import { Create, FirestoreEntity, Update } from 'src/common/type/entity.type';
import { Wrapper } from 'src/common/type/wrapper.type';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  FirestoreCollectionRepository,
  TrainingRef,
  UserWorkloadRef,
} from '../../common/type/firestore.type';
import { UserWorkload } from '../entity/user-workload.entity';
import { SetStatus } from '../enum/set-status.enum';
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

  getKey(ref: UserWorkloadRef): string {
    return `${ref.userId}-${ref.exerciseId}`;
  }

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

  async getDoc(ref: UserWorkloadRef): Promise<UserWorkload | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<UserWorkload>,
    );
  }

  async addDoc(ref: UserWorkloadRef, data: Create<UserWorkload>) {
    const query = this.firebaseService.buildCreateQuery<UserWorkload>(
      {
        userId: ref.userId,
        trainingId: data.trainingId,
        exerciseId: data.exerciseId,
        sets: data.sets,
        setType: data.setType,
        setTypeValue: data.setTypeValue,
        workloadType: data.workloadType,
        workloadValue: data.workloadValue,
        status: SetStatus.NOT_STARTED,
        data: [],
      },
      { timestamps: true },
    );

    await this.doc(ref).set(query);
    return ref.userId;
  }

  async updateDoc(ref: UserWorkloadRef, data: Update<UserWorkload>) {
    const query = this.firebaseService.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async deleteDoc(ref: UserWorkloadRef) {
    await this.doc(ref).delete();
  }

  doc(ref: UserWorkloadRef): DocumentReference {
    return this.collection(ref).doc(this.getKey(ref));
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.trainingRepository
      .doc(ref.trainingId)
      .collection(FirestoreCollection.TRAINING_WORKLOAD);
  }
}
