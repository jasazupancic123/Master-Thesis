import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import { CollectionRepository } from '../../firebase/firestore.type';
import { TrainingExerciseUserData } from '../entity/training-exercise-user-data.entity';
import { TrainingExerciseRef, TrainingExerciseRepository } from './training-exercise.repository';

export type TrainingExerciseUserDataRef = TrainingExerciseRef & { userId?: string }

@Injectable()
export class TrainingExerciseUserDataRepository implements CollectionRepository<TrainingExerciseUserData, TrainingExerciseUserDataRef> {
  constructor(private readonly trainingExerciseRepository: TrainingExerciseRepository) {
  }

  async getDocs(ref: TrainingExerciseUserDataRef): Promise<TrainingExerciseUserData[]> {
    const snapshot = await this.collection(ref).get();
    return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }) as TrainingExerciseUserData);
  }

  async getDoc(ref: TrainingExerciseUserDataRef): Promise<TrainingExerciseUserData> {
    const snapshot = await this.doc(ref).get();
    return { userId: snapshot.id, ...snapshot.data() } as TrainingExerciseUserData;
  }

  async addDoc(ref: TrainingExerciseUserDataRef, data: TrainingExerciseUserData) {
    await this.doc(ref).set(data);
  }

  async updateDoc(ref: TrainingExerciseUserDataRef, data: Partial<TrainingExerciseUserData>) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  doc(ref: TrainingExerciseUserDataRef): DocumentReference {
    if (!ref.userId) throw new Error('userId is required');
    return this.collection(ref).doc(ref.userId);
  }

  collection(ref: TrainingExerciseUserDataRef): CollectionReference {
    return this.trainingExerciseRepository.doc(ref).collection(FirestoreCollection.TRAINING_EXERCISE_USER_DATA);
  }
}