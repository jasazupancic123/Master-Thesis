import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference, Query } from 'firebase-admin/firestore';
import { CollectionRepository } from '../../firebase/firestore.type';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingRef, TrainingRepository } from './training.repository';

export type TrainingComponentRef = TrainingRef & { componentId?: string }

@Injectable()
export class TrainingComponentRepository implements CollectionRepository<TrainingComponent, TrainingComponentRef> {
  constructor(
    private readonly trainingRepository: TrainingRepository,
  ) {
  }

  async getDocs(
    ref: TrainingComponentRef,
    query: (ref: CollectionReference) => Query = ref => ref,
  ): Promise<TrainingComponent[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map(doc => ({ componentId: doc.id, ...doc.data() } as TrainingComponent));
  }

  async getDoc(ref: TrainingComponentRef): Promise<TrainingComponent> {
    const snapshot = await this.doc(ref).get();
    return { componentId: snapshot.id, ...snapshot.data() } as TrainingComponent;
  }

  async addDoc(ref: TrainingComponentRef, data: TrainingComponent) {
    await this.doc(ref).set(data);
  }

  async updateDoc(ref: TrainingComponentRef, data: Partial<TrainingComponent>) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  doc(ref: TrainingComponentRef): DocumentReference {
    if (!ref.componentId) throw new Error('componentId is required');
    return this.collection(ref).doc(ref.componentId);
  }

  collection(ref: TrainingComponentRef): CollectionReference {
    return this.trainingRepository.doc(ref).collection(FirestoreCollection.TRAINING_COMPONENT);
  }
}