import { Injectable } from '@nestjs/common';
import { CommonService } from '../../common/service/common.service';
import {
  ExerciseAttributeValueRef,
  ExerciseRef,
  FirestoreCollectionRepository,
} from '../../common/type/firestore.type';
import { ExerciseAttributeValue } from '../../exercise/entity/exercise-attribute-value.entity';
import { ExerciseRepository } from './exercise.repository';
import { Query } from 'firebase-admin/firestore';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class ExerciseAttributeValueRepository
  implements FirestoreCollectionRepository<ExerciseAttributeValue, ExerciseRef>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly firebaseService: FirebaseService,
  ) {}

  async getDocs(
    ref: ExerciseRef,
    query: (query: Query) => Query = (query) => query,
  ): Promise<ExerciseAttributeValue[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(
        doc.data() as FirestoreEntity<ExerciseAttributeValue>,
      ),
    );
  }

  async getDoc(
    ref: ExerciseAttributeValueRef,
  ): Promise<ExerciseAttributeValue | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<ExerciseAttributeValue>,
    );
  }

  async getAllByExercise(ref: ExerciseRef) {
    return this.collection(ref)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<ExerciseAttributeValue>,
          ),
        ),
      );
  }

  async addDoc(
    ref: ExerciseAttributeValueRef,
    input: Create<ExerciseAttributeValue>,
  ): Promise<string> {
    const query =
      this.firebaseService.buildCreateQuery<ExerciseAttributeValue>(input);
    await this.doc(ref).set(query);

    return ref.field;
  }

  async updateDoc(
    ref: ExerciseAttributeValueRef,
    input: Update<ExerciseAttributeValue>,
  ): Promise<void> {
    const query =
      this.firebaseService.buildUpdateQuery<ExerciseAttributeValue>(input);
    await this.doc(ref).update(query);
  }

  async deleteDoc(ref: ExerciseAttributeValueRef): Promise<void> {
    await this.doc(ref).delete();
  }

  doc(ref: ExerciseAttributeValueRef) {
    return this.collection(ref).doc(ref.field);
  }

  collection(ref: ExerciseRef) {
    return this.exerciseRepository
      .doc(ref.exerciseId)
      .collection(FirestoreCollection.EXERCISE_ATTRIBUTE_VALUES);
  }
}
