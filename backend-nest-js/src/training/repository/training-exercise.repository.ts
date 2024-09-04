import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import { CollectionRepository } from '../../firebase/firestore.type';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingComponentRef, TrainingComponentRepository } from './training-component.repository';
import { Query } from 'firebase-admin/lib/firestore';

export type TrainingExerciseRef = TrainingComponentRef & { exerciseId?: string }

@Injectable()
export class TrainingExerciseRepository implements CollectionRepository<TrainingExercise, TrainingExerciseRef> {
  constructor(private readonly trainingComponentRepository: TrainingComponentRepository) {
  }

  async getDocs(
    ref: TrainingExerciseRef,
    query: (ref: CollectionReference) => Query = ref => ref,
  ): Promise<TrainingExercise[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map(doc => ({ exerciseId: doc.id, ...doc.data() } as TrainingExercise));
  }

  async getDoc(ref: TrainingExerciseRef): Promise<TrainingExercise> {
    const snapshot = await this.doc(ref).get();
    return { exerciseId: snapshot.id, ...snapshot.data() } as TrainingExercise;
  }

  async addDoc(ref: TrainingExerciseRef, data: TrainingExercise) {
    await this.doc(ref).set(data);
  }

  async updateDoc(ref: TrainingExerciseRef, data: Partial<TrainingExercise>) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  doc(ref: TrainingExerciseRef): DocumentReference {
    if (!ref.exerciseId) throw new Error('exerciseId is required');
    return this.collection(ref).doc(ref.exerciseId);
  }

  collection(ref: TrainingExerciseRef): CollectionReference {
    return this.trainingComponentRepository.doc(ref).collection(FirestoreCollection.TRAINING_EXERCISE);
  }
}