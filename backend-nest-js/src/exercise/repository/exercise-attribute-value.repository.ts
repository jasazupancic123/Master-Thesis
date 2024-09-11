import { Injectable } from '@nestjs/common';
import {
  ExerciseAttributeValueRef,
  ExerciseRef,
  FirestoreCollectionRepository,
} from '../../common/type/firebase-firestore.type';
import { ExerciseAttributeValue } from '../entity/exercise-attribute-value.entity';
import { CommonService } from '../../common/service/common.service';
import { ExerciseRepository } from './exercise.repository';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

@Injectable()
export class ExerciseAttributeValueRepository
  implements
    FirestoreCollectionRepository<
      ExerciseAttributeValue,
      ExerciseAttributeValueRef
    >
{
  constructor(
    private readonly commonService: CommonService,
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  async getDocs(
    ref: Required<ExerciseRef>,
    query: (query: Query) => Query = (query) => query,
  ): Promise<ExerciseAttributeValue[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(
    ref: Required<ExerciseAttributeValueRef>,
  ): Promise<ExerciseAttributeValue> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(
    ref: Required<ExerciseAttributeValueRef>,
    input: Partial<ExerciseAttributeValue>,
  ): Promise<string> {
    await this.doc(ref).set({
      attributeId: ref.attributeId,
      exerciseId: ref.exerciseId,
      value: input.value,
    });

    return ref.attributeId;
  }

  async updateDoc(
    ref: Required<ExerciseAttributeValueRef>,
    input: Partial<ExerciseAttributeValue>,
  ): Promise<void> {
    const data = this.commonService.object.clean(input);
    await this.doc(ref).update(data);
  }

  doc(ref: Required<ExerciseAttributeValueRef>): DocumentReference {
    return this.collection(ref).doc(ref.attributeId);
  }

  collection(ref: Required<ExerciseRef>): CollectionReference {
    return this.exerciseRepository
      .doc(ref.exerciseId)
      .collection(FirestoreCollection.EXERCISE_ATTRIBUTE_VALUE);
  }

  serialize(
    snapshot: DocumentSnapshot | QueryDocumentSnapshot,
  ): ExerciseAttributeValue {
    const data = snapshot.data();

    return {
      exerciseId: snapshot.ref.parent.id,
      attributeId: snapshot.id,
      attribute: null,
      value: data.value,
    };
  }
}
