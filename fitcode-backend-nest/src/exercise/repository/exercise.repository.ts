import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { Exercise } from '../entity/exercise.entity';
import { CommonService } from '../../common/service/common.service';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class ExerciseRepository
  implements RootFirestoreCollectionRepository<Exercise>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Exercise[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(exerciseId: string): Promise<Exercise> {
    const snapshot = await this.doc(exerciseId).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(input: Partial<Exercise>) {
    const result = await this.collection().add({
      userId: input.userId,
      name: input.name,
      componentIds: input.componentsIds,
      global: input.global ?? false,
      imageUrl: input.imageUrl ?? null,
      videoUrl: input.videoUrl ?? null,
      values: !input.values?.length ? [] : input.values,
    });

    return result.id;
  }

  async updateDoc(exerciseId: string, input: Partial<Exercise>) {
    const data = this.commonService.object.clean(input);
    await this.doc(exerciseId).update(data);
  }

  async deleteDoc(exerciseId: string) {
    await this.doc(exerciseId).update({ deletedAt: Timestamp.now() });
  }

  doc(exerciseId: string): DocumentReference {
    return this.collection().doc(exerciseId);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.EXERCISE,
    );
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Exercise {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      userId: data.userId,
      name: data.name,
      componentsIds: data.componentIds,
      global: data.global ?? false,
      imageUrl: data.imageUrl ?? null,
      videoUrl: data.videoUrl ?? null,
      values: data.values ?? [],
      attributeValues: this.attributesToObject(data as Exercise),
    } as Exercise;
  }

  /**
   * Convert exercise's attribute values to nested object for frontend.
   */
  private attributesToObject(exercise: Exercise): Record<string, any> {
    // convert found attributes and attribute values to nested object for frontend
    const nested: Record<string, any> = {};
    for (const { attributeId, value } of exercise.values)
      nested[attributeId] = value;

    return nested;
  }
}
