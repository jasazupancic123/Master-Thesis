import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository, UserRef } from '@src/common/type/firestore.type';
import { BatchSetOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';

import { Profile } from '../entity/profile.entity';

@Injectable()
export class ProfileRepository extends FirestoreRepository<Profile> {
  collectionName = FirestoreCollection.PROFILE;

  constructor(readonly firebase: FirebaseService) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(this.collectionName);
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  async findAllByInstitution(institution: Institution) {
    const userIds = [
      institution.ownerId,
      ...(institution.trainerIds || []),
      ...(institution.athleteIds || []),
    ];

    const uniqueUserIds = Array.from(new Set(userIds));
    return await this.findManyOrCreate(uniqueUserIds);
  }

  /**
   * Sometimes, the users they are created in Auth but not in Firestore.
   * This can happen when importing users in bulk, registering new athlete,
   * registering new trainer, etc. This function will check if auth user
   * exists, and if so, create a corresponding profile in Firestore. If the
   * profile already exists, it will return the existing profile.
   */
  async findOneOrCreate(ref: UserRef): Promise<Profile> {
    let profile = await this.findById(ref.uid);
    if (!profile) {
      await this.save({ id: ref.uid });
      profile = { id: ref.uid, createdAt: new Date(), updatedAt: new Date() };
    }

    return profile;
  }

  async findManyOrCreate(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return [];

    const profiles = await this.firebase.batchIn<Profile>(
      'id',
      ids,
      this.collection(),
    );

    const existingIds = profiles.map((p) => p.id);
    const missingIds = ids.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0) {
      const operations: BatchSetOperation<Profile>[] = [];
      missingIds.forEach((id) => {
        profiles.push({ id, createdAt: new Date(), updatedAt: new Date() });
        operations.push({
          operation: 'set',
          ref: this.doc(id),
          data: this.firebase.buildCreateQuery({ id }, { timestamps: true }),
        });
      });

      await this.firebase.paginateBatches(operations);
    }

    return profiles;
  }

  async save(input: Create<Profile>) {
    if (!input.id) throw new Error('User ID is required');

    const query = this.firebase.buildCreateQuery<Profile>(
      { id: input.id, ...input },
      { timestamps: true },
    );

    await this.doc(input.id).set(query);
    return input.id;
  }

  async update(id: string, input: Update<Profile>) {
    const query = this.firebase.buildUpdateQuery(input);
    await this.doc(id).update(query);
  }

  async delete(id: string) {
    await this.doc(id).update({ deletedAt: Timestamp.now() });
  }
}
