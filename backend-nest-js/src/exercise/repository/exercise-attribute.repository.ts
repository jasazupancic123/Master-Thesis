import { Injectable } from '@nestjs/common';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { ExerciseAttribute } from '../entity/exercise-attribute.entity';
import { CommonService } from '../../common/service/common.service';
import { FirebaseService } from '../../firebase/firebase.service';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

@Injectable()
export class ExerciseAttributeRepository
  implements RootFirestoreCollectionRepository<ExerciseAttribute>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<ExerciseAttribute[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(field: string): Promise<ExerciseAttribute | null> {
    const snapshot = await this.doc(field).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(input: Partial<ExerciseAttribute>) {
    if (!input.field) throw new Error('Exercise attribute field is required');

    if (input.type === 'select' && !input.values?.length)
      throw new Error('Select attribute type must have values');

    await this.doc(input.field).set({
      field: input.field,
      name: input.name,
      required: input.required ?? false,
      type: input.type ?? 'string',
      unit: input.unit ?? null,
      values: input.values ?? null,
    });

    return input.field;
  }

  async updateDoc(field: string, input: Partial<ExerciseAttribute>) {
    const data = this.commonService.object.clean(input);
    await this.doc(field).update(data);
  }

  async deleteDoc(field: string) {
    await this.doc(field).update({ deleted: true });
  }

  doc(field: string): DocumentReference {
    return this.collection().doc(field);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.EXERCISE_ATTRIBUTE,
    );
  }

  serialize(
    snapshot: DocumentSnapshot | QueryDocumentSnapshot,
  ): ExerciseAttribute {
    const data = snapshot.data();

    return {
      field: data.field,
      name: data.name,
      required: data.required,
      type: data.type,
      unit: data.unit ?? null,
      values: data.values ?? [],
    };
  }
}
