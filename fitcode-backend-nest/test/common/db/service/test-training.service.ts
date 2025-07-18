import type { CollectionReference } from 'firebase-admin/firestore';
import { v4 } from 'uuid';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Training } from '@src/training/entity/training.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TestTrainingService {
  readonly collection: CollectionReference;

  constructor(private readonly firebase: FirebaseService) {
    this.collection = this.firebase.firestore.collection(
      FirestoreCollection.TRAINING,
    );
  }

  async get(trainingId: string): Promise<Training | null> {
    return await this.collection
      .doc(trainingId)
      .get()
      .then((doc) => {
        if (!doc.exists) return null;
        return this.firebase.serialize(doc.data() as FirestoreEntity<Training>);
      });
  }

  async create(input: Create<Training>): Promise<Training> {
    const id = input.id || v4();
    const docRef = this.collection.doc(id);
    await docRef.set({ ...input, id });

    return this.firebase.serialize(
      (await docRef.get()).data() as FirestoreEntity<Training>,
    );
  }

  async delete(trainingId: string): Promise<void> {
    const docRef = this.collection.doc(trainingId);
    await docRef.delete();
  }

  async deleteCollection(): Promise<void> {
    return await this.firebase.firestore.recursiveDelete(this.collection);
  }
}
