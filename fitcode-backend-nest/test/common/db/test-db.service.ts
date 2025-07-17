import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import type { FirebaseService } from '@src/firebase/firebase.service';

import { TestTrainingService } from './service/test-training.service';
import { TestWorkloadService } from './service/test-workload.service';

export class TestDbService {
  readonly trainings: TestTrainingService;
  readonly workloads: TestWorkloadService;

  constructor(readonly firebase: FirebaseService) {
    this.workloads = new TestWorkloadService(firebase);
    this.trainings = new TestTrainingService(firebase);
  }

  async clear() {
    for (const collection of Object.values(FirestoreCollection)) {
      const collectionRef = this.firebase.firestore.collection(collection);
      await this.firebase.firestore.recursiveDelete(collectionRef);
    }
  }
}
