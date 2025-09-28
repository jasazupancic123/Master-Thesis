import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import {
  ExerciseAttributeValueRef,
  ExerciseRef,
  FirestoreRepository,
} from '@src/common/type/firestore.type';
import { ExerciseAttributeValue } from '@src/exercise/entity/exercise-attribute-value.entity';
import { FirebaseService } from '@src/firebase/firebase.service';

import { ExerciseRepository } from './exercise.repository';

@Injectable()
export class ExerciseAttributeValueRepository extends FirestoreRepository<
  ExerciseAttributeValue,
  ExerciseRef
> {
  collectionName = FirestoreCollection.EXERCISE_ATTRIBUTE_VALUES;

  constructor(
    readonly firebase: FirebaseService,
    private readonly exerciseRepository: ExerciseRepository,
  ) {
    super(firebase);
  }

  collection(ref: ExerciseRef) {
    return this.exerciseRepository
      .doc(ref.exerciseId)
      .collection(FirestoreCollection.EXERCISE_ATTRIBUTE_VALUES);
  }

  collectionGroup() {
    return this.firebase.firestore.collectionGroup(
      FirestoreCollection.EXERCISE_ATTRIBUTE_VALUES,
    );
  }

  doc(ref: ExerciseAttributeValueRef) {
    return this.collection(ref).doc(ref.exerciseAttributeValueId);
  }

  async getAllByExercise(ref: ExerciseRef) {
    return this.collection(ref)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebase.serialize(
            doc.data() as FirestoreEntity<ExerciseAttributeValue>,
          ),
        ),
      );
  }

  async deleteAllByExercise(
    ref: ExerciseRef,
    batch?: FirebaseFirestore.WriteBatch,
  ) {
    const values = await this.getAllByExercise(ref);
    await Promise.all(
      values.map((v) =>
        this.delete({ ...ref, exerciseAttributeValueId: v.id }, batch),
      ),
    );
  }

  async save(
    input: Create<ExerciseAttributeValue>,
    ref: ExerciseAttributeValueRef,
  ): Promise<string> {
    const query = this.firebase.buildCreateQuery<ExerciseAttributeValue>(input);

    const docRef = this.collection(ref).doc();
    const exerciseAttributeValueId = docRef.id;
    await this.doc({ ...ref, exerciseAttributeValueId }).set(query);

    return exerciseAttributeValueId;
  }

  async update(
    ref: ExerciseAttributeValueRef,
    input: Update<ExerciseAttributeValue>,
  ): Promise<void> {
    const query = this.firebase.buildUpdateQuery<ExerciseAttributeValue>(input);
    await this.doc(ref).update(query);
  }

  async delete(
    ref: ExerciseAttributeValueRef,
    batch?: FirebaseFirestore.WriteBatch,
  ): Promise<void> {
    if (batch) batch.delete(this.doc(ref));
    else await this.doc(ref).delete();
  }
}
