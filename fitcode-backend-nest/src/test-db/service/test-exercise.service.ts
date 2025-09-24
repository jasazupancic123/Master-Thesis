import { Injectable } from '@nestjs/common';
import slugify from 'slugify';

import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import { CACHE_KEY_EXERCISES } from '@src/exercise/constant/get-exercises-cache-key.constant';
import { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { FirebaseService } from '@src/firebase/firebase.service';

import { AbstractChangeLogService } from './abstract-test-change-log.service';

@Injectable()
export class TestExerciseService extends AbstractChangeLogService<Exercise> {
  constructor(
    protected readonly firebase: FirebaseService,
    private readonly cache: CacheManagerService,
  ) {
    super(firebase);
  }

  collection() {
    return this.firebase.firestore.collection(FirestoreCollection.EXERCISE);
  }

  attributeValuesCollection(exerciseId: string) {
    return this.collection()
      .doc(exerciseId)
      .collection(FirestoreCollection.EXERCISE_ATTRIBUTE_VALUES);
  }

  async get(id: string): Promise<Exercise> {
    const doc = await this.collection().doc(id).get();
    if (!doc.exists) return null;

    const exercise = this.firebase.serialize(
      doc.data() as FirestoreEntity<Exercise>,
    );

    return exercise;
  }

  async getAll(): Promise<Exercise[]> {
    return await this.collection()
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) =>
          this.firebase.serialize(doc.data() as FirestoreEntity<Exercise>),
        ),
      );
  }

  async create(
    input: Partial<Create<Exercise>> & {
      ownerId: string;
      componentIds: string[];
    },
  ): Promise<Exercise> {
    const data = generateExerciseStub(input);
    data.id = data.id || slugify(data.name, { lower: true, strict: true });

    const query = this.firebase.buildCreateQuery<Exercise>(data, {
      timestamps: true,
    });

    const ref = this.collection().doc(data.id);
    await ref.set(query);
    await this.cache.del(CACHE_KEY_EXERCISES);
    this.trackCreate(ref);

    return await this.get(data.id);
  }

  async clear() {
    await this.firebase.firestore.recursiveDelete(this.collection());
    await this.cache.del(CACHE_KEY_EXERCISES);
  }

  async delete(id?: string): Promise<void> {
    if (!id)
      return await this.firebase.firestore.recursiveDelete(this.collection());

    const docRef = this.collection().doc(id);

    // first, delete all attribute values
    const attributeValuesRef = this.attributeValuesCollection(id);
    const attributeValuesSnapshot = await attributeValuesRef.get();
    for (const doc of attributeValuesSnapshot.docs) {
      await doc.ref.delete();
      await this.trackDelete(doc.ref);
    }

    await docRef.delete();
    await this.trackDelete(docRef);
    await this.cache.del(CACHE_KEY_EXERCISES);
  }
}
