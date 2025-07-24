import { Injectable } from '@nestjs/common';

import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create } from '@src/common/type/entity.type';
import { CACHE_KEY_EXERCISES } from '@src/exercise/constant/get-exercises-cache-key.constant';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { FirebaseService } from '@src/firebase/firebase.service';

@Injectable()
export class TestExerciseService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly cache: CacheManagerService,
  ) {}

  async create(
    input: Partial<Create<Exercise>> & {
      ownerId: string;
      componentIds: string[];
    },
  ): Promise<Exercise> {
    const data = generateExerciseStub(input);
    const query = this.firebase.buildCreateQuery<Exercise>(data, {
      timestamps: true,
    });

    await this.firebase.firestore
      .collection(FirestoreCollection.EXERCISE)
      .add(query)
      .then((docRef) => this.firebase.serialize(docRef));

    await this.cache.del(CACHE_KEY_EXERCISES);
    return this.firebase.serialize(query);
  }

  async clear() {
    const collectionRef = this.firebase.firestore.collection(
      FirestoreCollection.EXERCISE,
    );

    await this.firebase.firestore.recursiveDelete(collectionRef);
  }

  async delete(id?: string): Promise<void> {
    if (!id)
      return await this.firebase.firestore.recursiveDelete(
        this.firebase.firestore.collection(FirestoreCollection.EXERCISE),
      );

    const docRef = this.firebase.firestore.doc(
      `${FirestoreCollection.EXERCISE}/${id}`,
    );

    await docRef.delete();
  }
}
