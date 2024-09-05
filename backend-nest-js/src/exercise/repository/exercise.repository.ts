import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference, Query } from 'firebase-admin/firestore';
import { FirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { Exercise } from '../entity/exercise.entity';

export type ExerciseRef = {
  exerciseId?: string;
}

@Injectable()
export class ExerciseRepository implements FirestoreCollectionRepository<Exercise, ExerciseRef> {
  constructor(private readonly firebaseService: FirebaseService) {
  }

  async getDocs(
    ref: ExerciseRef,
    query: (query: Query) => Query = query => query,
  ): Promise<Exercise[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Exercise);
  }

  async getDoc(ref: ExerciseRef): Promise<Exercise> {
    const snapshot = await this.doc(ref).get();
    return { id: snapshot.id, ...snapshot.data() } as Exercise;
  }

  async addDoc(ref: ExerciseRef, data: Partial<Exercise>) {
    await this.doc(ref).set({
      userId: data.userId,
      name: data.name,
      componentIds: data.componentIds,
      global: data.global ?? false,
      imageUrl: data.imageUrl ?? null,
      videoUrl: data.videoUrl ?? null,
    });
  }

  async updateDoc(ref: ExerciseRef, data: Partial<Exercise>) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  doc(ref: ExerciseRef): DocumentReference {
    if (!ref.exerciseId) throw new Error('exerciseId is required');
    return this.collection().doc(ref.exerciseId);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore
      .collection(FirestoreCollection.EXERCISE);
  }
}