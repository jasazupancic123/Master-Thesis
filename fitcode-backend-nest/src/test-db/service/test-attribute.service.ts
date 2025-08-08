import { CollectionReference } from '@google-cloud/firestore';
import { Injectable } from '@nestjs/common';

import { CACHE_KEY_ATTRIBUTES } from '@src/attribute/constant/cache.constant';
import { Attribute } from '@src/attribute/entity/attribute.entity';
import { generateAttributeStub } from '@src/attribute/mock/attribute.stub';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { AbstractChangeLogService } from './abstract-test-change-log.service';

@Injectable()
export class TestAttributeService extends AbstractChangeLogService<Attribute> {
  constructor(
    protected readonly firebase: FirebaseService,
    private readonly cache: CacheManagerService,
  ) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(FirestoreCollection.ATTRIBUTE);
  }

  async get(): Promise<Attribute[]> {
    return this.collection()
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) =>
          this.firebase.serialize(doc.data() as FirestoreEntity<Attribute>),
        ),
      );
  }

  async create(input: Partial<Create<Attribute>>): Promise<Attribute> {
    const data = generateAttributeStub(input);
    const query = this.firebase.buildCreateQuery<Attribute>(data);

    const ref = this.collection().doc(data.field);
    await ref.set(query);
    this.trackCreate(ref);

    await this.cache.del(CACHE_KEY_ATTRIBUTES);
    return this.firebase.serialize(query);
  }

  async createMany(input: Partial<Create<Attribute>>[]): Promise<Attribute[]> {
    const operations = input.map(async (item) => {
      const data = generateAttributeStub(item);
      const query = this.firebase.buildCreateQuery<Attribute>(data);

      const ref = this.collection().doc(data.field);
      this.trackCreate(ref);
      return ref.set(query).then(() => this.firebase.serialize(query));
    });

    const result = await Promise.all(operations);
    await this.cache.del(CACHE_KEY_ATTRIBUTES);
    return result;
  }

  async clear() {
    const collectionRef = this.firebase.firestore.collection(
      FirestoreCollection.ATTRIBUTE,
    );

    await this.firebase.firestore.recursiveDelete(collectionRef);
  }

  async delete(id?: string): Promise<void> {
    if (!id)
      return await this.firebase.firestore.recursiveDelete(
        this.firebase.firestore.collection(FirestoreCollection.ATTRIBUTE),
      );

    const docRef = this.firebase.firestore.doc(
      `${FirestoreCollection.ATTRIBUTE}/${id}`,
    );

    await docRef.delete();
  }
}
