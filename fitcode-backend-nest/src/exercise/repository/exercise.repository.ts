import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { Create, FirestoreEntity, Update } from 'src/common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { RootFirestoreCollectionRepository } from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Exercise } from '../entity/exercise.entity';

@Injectable()
export class ExerciseRepository
  implements RootFirestoreCollectionRepository<Exercise>
{
  constructor(private readonly firebaseService: FirebaseService) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Exercise[]> {
    const snapshot = await query(this.collection())
      .where('deletedAt', '==', null)
      .get();

    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(exerciseId: string): Promise<Exercise> {
    const snapshot = await this.doc(exerciseId).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(input: Create<Exercise>) {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Exercise>(
      {
        id,
        userId: input.userId,
        name: input.name,
        componentsIds: input.componentsIds,
        global: input.global ?? false,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        values: !input.values?.length ? [] : input.values,
      },
      { timestamps: true },
    );

    await this.doc(id).set(query);
    return id;
  }

  async updateDoc(exerciseId: string, input: Update<Exercise>) {
    const data = this.firebaseService.buildUpdateQuery(input);
    await this.doc(exerciseId).update(data);
  }

  async deleteDoc(exerciseId: string) {
    // soft delete
    const query = this.firebaseService.buildUpdateQuery<Exercise>({
      deletedAt: new Date(),
    });

    await this.doc(exerciseId).update(query);
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
    const serialized = this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Exercise>,
    );

    serialized.attributeValues = this.attributesToObject(serialized);
    return serialized;
  }

  /**
   * Convert exercise's attribute values to nested object for frontend.
   */
  private attributesToObject(exercise: Exercise): Record<string, any> {
    const nested: Record<string, any> = {};
    for (const { attributeId, value } of exercise.values)
      nested[attributeId] = value;

    return nested;
  }
}
