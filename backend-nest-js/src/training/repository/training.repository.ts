import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import { CollectionRepository } from '../../firebase/firestore.type';
import { Training } from '../entity/training.entity';

export type TrainingRef = {
  groupId: string;
  cycleId: string;
  trainingId?: string;
}

@Injectable()
export class TrainingRepository implements CollectionRepository<Training, TrainingRef> {
  constructor(private readonly firebaseService: FirebaseService) {
  }

  async getDocs(
    ref: TrainingRef,
    query: (query: CollectionReference) => CollectionReference = query => query,
  ): Promise<Training[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Training);
  }

  async getDoc(ref: TrainingRef): Promise<Training> {
    const snapshot = await this.doc(ref).get();
    return { id: snapshot.id, ...snapshot.data() } as Training;
  }

  async addDoc(ref: TrainingRef, data: Training) {
    await this.doc(ref).set(data);
  }

  async updateDoc(ref: TrainingRef, data: Partial<Training>) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  doc(ref: TrainingRef): DocumentReference {
    if (!ref.trainingId) throw new Error('trainingId is required');
    return this.collection(ref).doc(ref.trainingId);
  }

  collection(ref: TrainingRef): CollectionReference {
    return this.firebaseService.firestore
      .collection(FirestoreCollection.GROUP)
      .doc(ref.groupId)
      .collection(FirestoreCollection.CYCLE)
      .doc(ref.cycleId)
      .collection(FirestoreCollection.TRAINING);
  }
}