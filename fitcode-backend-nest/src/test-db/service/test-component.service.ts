import { CollectionReference } from '@google-cloud/firestore';
import { Injectable } from '@nestjs/common';

import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import { CACHE_KEY_FLAT_COMPONENTS } from '@src/component/constant/cache.constant';
import { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { FirebaseService } from '@src/firebase/firebase.service';

import { AbstractChangeLogService } from './abstract-test-change-log.service';

@Injectable()
export class TestComponentService extends AbstractChangeLogService<Component> {
  constructor(
    protected readonly firebase: FirebaseService,
    private readonly cache: CacheManagerService,
  ) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(FirestoreCollection.COMPONENT);
  }

  async get(): Promise<Component[]> {
    return this.collection()
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) =>
          this.firebase.serialize(doc.data() as FirestoreEntity<Component>),
        ),
      );
  }

  async create(input?: Partial<Create<Component>>): Promise<Component> {
    const data = generateComponentStub(input);
    const query = this.firebase.buildCreateQuery<Component>(data);

    const ref = this.collection().doc(data.id);
    await ref.set(query);
    this.trackCreate(ref);

    await this.cache.del(CACHE_KEY_FLAT_COMPONENTS);
    return this.firebase.serialize(query);
  }

  async createMany(input: Partial<Create<Component>>[]): Promise<Component[]> {
    const operations = input.map(async (item) => {
      const data = generateComponentStub(item);
      const query = this.firebase.buildCreateQuery<Component>(data);

      const ref = this.collection().doc(data.id);
      this.trackCreate(ref);
      return ref.set(query).then(() => this.firebase.serialize(query));
    });

    const result = await Promise.all(operations);
    await this.cache.del(CACHE_KEY_FLAT_COMPONENTS);
    return result;
  }

  async clear() {
    const collectionRef = this.firebase.firestore.collection(
      FirestoreCollection.COMPONENT,
    );

    await this.firebase.firestore.recursiveDelete(collectionRef);
  }

  async delete(id?: string): Promise<void> {
    if (!id)
      return await this.firebase.firestore.recursiveDelete(
        this.firebase.firestore.collection(FirestoreCollection.COMPONENT),
      );

    const docRef = this.firebase.firestore.doc(
      `${FirestoreCollection.COMPONENT}/${id}`,
    );

    await docRef.delete();
  }
}
