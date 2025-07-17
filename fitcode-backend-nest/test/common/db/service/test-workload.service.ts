import type {
  CollectionGroup,
  CollectionReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import type { FirestoreEntity } from '@src/common/type/entity.type';
import type { FirebaseService } from '@src/firebase/firebase.service';
import type { Workload } from '@src/training/entity/workload.entity';

export class TestWorkloadService {
  readonly collectionGroup: CollectionGroup;

  constructor(private readonly firebase: FirebaseService) {
    this.collectionGroup = this.firebase.firestore.collectionGroup(
      FirestoreCollection.TRAINING_WORKLOAD,
    );
  }

  collection(trainingId: string): CollectionReference {
    return this.firebase.firestore
      .collection(FirestoreCollection.TRAINING)
      .doc(trainingId)
      .collection(FirestoreCollection.TRAINING_WORKLOAD);
  }

  async getAllByTrainingId(trainingId: string): Promise<Workload[]> {
    return await this.collection(trainingId)
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) =>
          this.firebase.serialize(doc.data() as FirestoreEntity<Workload>),
        ),
      );
  }
}
