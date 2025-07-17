import type { CollectionReference } from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import type { FirestoreEntity } from '@src/common/type/entity.type';
import type { FirebaseService } from '@src/firebase/firebase.service';
import type { Training } from '@src/training/entity/training.entity';

export class TestTrainingService {
  readonly collection: CollectionReference;

  constructor(private readonly firebase: FirebaseService) {
    this.collection = this.firebase.firestore.collection(
      FirestoreCollection.TRAINING,
    );
  }

  async getDoc(trainingId: string): Promise<Training | null> {
    return await this.collection
      .doc(trainingId)
      .get()
      .then((doc) => {
        if (!doc.exists) return null;
        return this.firebase.serialize(doc.data() as FirestoreEntity<Training>);
      });
  }
}
