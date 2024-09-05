import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { CycleRef, FirestoreCollectionRepository, TrainingRef } from '../../common/type/firebase-firestore.type';
import { Training } from '../entity/training.entity';
import { CommonService } from '../../common/service/common.service';

@Injectable()
export class TrainingRepository implements FirestoreCollectionRepository<Training, TrainingRef> {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService) {
  }

  async getDocs(
    ref: Required<CycleRef>,
    query: (query: Query) => Query = query => query,
  ): Promise<Training[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  async getDoc(ref: Required<TrainingRef>): Promise<Training | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(ref: Required<CycleRef>, input: Partial<Training>): Promise<string> {
    const result = await this.collection(ref).add({
      subgroupId: input.subgroupId || null,
      from: Timestamp.fromDate(input.from),
      to: Timestamp.fromDate(input.to),
    });

    return result.id;
  }

  async updateDoc(ref: Required<TrainingRef>, input: Partial<Training>) {
    const data = this.commonService.object.clean(input);
    await this.doc(ref).update(data);
  }

  doc(ref: Required<TrainingRef>): DocumentReference {
    return this.collection(ref).doc(ref.trainingId);
  }

  collection(ref: Required<CycleRef>): CollectionReference {
    return this.firebaseService.firestore
      .collection(FirestoreCollection.GROUP)
      .doc(ref.groupId)
      .collection(FirestoreCollection.CYCLE)
      .doc(ref.cycleId)
      .collection(FirestoreCollection.TRAINING);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Training {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      subgroupId: data.subgroupId,
      from: (data.from as Timestamp).toDate(),
      to: (data.to as Timestamp).toDate(),
      components: [],
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as Training;
  }
}