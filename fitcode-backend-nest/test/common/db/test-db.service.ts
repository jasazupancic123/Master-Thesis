import { FirebaseService } from '@src/firebase/firebase.service';

import { TestExerciseService } from './service/test-exercise.service';
import { TestTrainingService } from './service/test-training.service';
import { TestWorkloadService } from './service/test-workload.service';
import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';

@Injectable()
export class TestDbService {
  constructor(
    private readonly firebase: FirebaseService,
    readonly trainings: TestTrainingService,
    readonly workloads: TestWorkloadService,
    readonly exercises: TestExerciseService,
  ) {}

  async clear() {
    for (const collection of Object.values(FirestoreCollection)) {
      const collectionRef = this.firebase.firestore.collection(collection);
      await this.firebase.firestore.recursiveDelete(collectionRef);
    }
  }
}
