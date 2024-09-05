import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference, Query } from 'firebase-admin/firestore';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { Exercise } from '../entity/exercise.entity';
import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/lib/firestore';
import { CommonService } from '../../common/service/common.service';

@Injectable()
export class ExerciseRepository implements RootFirestoreCollectionRepository<Exercise> {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {
  }

  async getDocs(query: (query: Query) => Query = query => query): Promise<Exercise[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  async getDoc(id: string): Promise<Exercise> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(input: Partial<Exercise>) {
    const result = await this.collection().add({
      userId: input.userId,
      name: input.name,
      componentIds: input.componentIds,
      global: input.global ?? false,
      imageUrl: input.imageUrl ?? null,
      videoUrl: input.videoUrl ?? null,
    });

    return result.id;
  }

  async updateDoc(id: string, input: Partial<Exercise>) {
    const data = this.commonService.object.clean(input);
    await this.doc(id).update(data);
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(FirestoreCollection.EXERCISE);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Exercise {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      userId: data.userId,
      name: data.name,
      componentIds: data.componentIds,
      global: data.global ?? false,
      imageUrl: data.imageUrl ?? null,
      videoUrl: data.videoUrl ?? null,
    } as Exercise;
  }
}