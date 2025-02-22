import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';
import { Create, FirestoreEntity, Update } from 'src/common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { RootFirestoreCollectionRepository } from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { ExerciseAttribute } from '../entity/exercise-attribute.entity';

@Injectable()
export class ExerciseAttributeRepository
  implements RootFirestoreCollectionRepository<ExerciseAttribute>
{
  constructor(private readonly firebaseService: FirebaseService) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<ExerciseAttribute[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(
        doc.data() as FirestoreEntity<ExerciseAttribute>,
      ),
    );
  }

  async getDoc(field: string): Promise<ExerciseAttribute | null> {
    const snapshot = await this.doc(field).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<ExerciseAttribute>,
    );
  }

  async addDoc(input: Create<ExerciseAttribute>) {
    if (!input.field) throw new Error('Exercise attribute field is required');
    if (input.type === 'select' && !input.values?.length)
      throw new Error('Select attribute type must have values');

    const query = this.firebaseService.buildCreateQuery<ExerciseAttribute>({
      field: input.field,
      name: input.name,
      required: input.required ?? false,
      type: input.type ?? 'string',
      unit: input.unit ?? null,
      values: input.values ?? null,
    });

    await this.doc(input.field).set(query);
    return input.field;
  }

  async updateDoc(field: string, input: Update<ExerciseAttribute>) {
    const query = this.firebaseService.buildUpdateQuery(input);
    await this.doc(field).update(query);
  }

  async deleteDoc(field: string) {
    await this.doc(field).delete();
  }

  doc(field: string): DocumentReference {
    return this.collection().doc(field);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.EXERCISE_ATTRIBUTE,
    );
  }
}
