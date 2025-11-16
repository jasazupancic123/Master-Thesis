import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { EXERCISE_AI_PRESCRIPTIONS_ID } from '../const/exercise-ai-prescriptions-id.const';
import { ExerciseAiPrescriptionString } from '../entity/exercise-ai-prescriptions';

@Injectable()
export class ExerciseAiPrescriptionsRepository extends FirestoreRepository<ExerciseAiPrescriptionString> {
  collectionName = FirestoreCollection.EXERCISE_AI_PRESCRIPTIONS;

  constructor(readonly firebase: FirebaseService) {
    super(firebase);
  }

  collection(): FirebaseFirestore.CollectionReference {
    return this.firebase.firestore.collection(this.collectionName);
  }

  doc(ref: string): FirebaseFirestore.DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<ExerciseAiPrescriptionString>) {
    const query = this.firebase.buildCreateQuery<ExerciseAiPrescriptionString>({
      prescriptions: input.prescriptions,
    });

    const ref = this.doc(EXERCISE_AI_PRESCRIPTIONS_ID);
    await ref.set(query);
    return EXERCISE_AI_PRESCRIPTIONS_ID;
  }

  async update(
    id: string,
    input: Partial<ExerciseAiPrescriptionString>,
  ): Promise<void> {
    const query = this.firebase.buildUpdateQuery<ExerciseAiPrescriptionString>({
      prescriptions: input.prescriptions,
    });

    const ref = this.doc(id);
    await ref.update(query);
  }

  async delete(id: string) {
    const ref = this.doc(id);
    await ref.delete();
  }
}
