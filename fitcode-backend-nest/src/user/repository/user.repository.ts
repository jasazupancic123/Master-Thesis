import { Injectable } from '@nestjs/common';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  Query,
  Timestamp,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { FirestoreEntity, Update } from '@src/common/type/entity.type';
import { RootFirestoreCollectionRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserRepository
  implements RootFirestoreCollectionRepository<UserEntity>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async findAll(
    query: (query: Query) => Query = (query) => query,
  ): Promise<UserEntity[]> {
    const snapshot = await query(this.collection()).get();

    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<UserEntity>),
    );
  }

  async findById(id: string): Promise<UserEntity | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<UserEntity>,
    );
  }

  async save(input: Partial<UserEntity>) {
    if (!input.id) throw new Error('User ID is required');

    const query = this.firebaseService.buildCreateQuery<UserEntity>(
      { id: input.id },
      { timestamps: true },
    );

    await this.doc(input.id).set(query);
    return input.id;
  }

  async update(id: string, input: Update<UserEntity>) {
    const query = this.firebaseService.buildUpdateQuery(input);
    await this.doc(id).update(query);
  }

  async delete(id: string) {
    await this.doc(id).update({ deletedAt: Timestamp.now() });
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(FirestoreCollection.USER);
  }

  /**
   * Newest query tool to query all sub collections with the same name. For user
   * repository, it can be useful to query all `groups` sub collections where
   * some user is a member, or `exercises` sub collections where some user is
   * the author.
   */
  collectionGroup(collectionGroupName: keyof UserEntity): CollectionGroup {
    return this.firebaseService.firestore.collectionGroup(collectionGroupName);
  }
}
