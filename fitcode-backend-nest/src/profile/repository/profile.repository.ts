import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
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

  doc(uid: string): DocumentReference {
    return this.collection().doc(uid);
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
  async findOneOrCreate(uid: string): Promise<Profile> {
    let profile = await this.findById(uid);
    if (!profile) {
      const user = await this.firebase.auth.getUser(uid);
      await this.save({ uid, email: user.email!, height: 0, weight: 0 });

      profile = {
        uid,
        email: user.email!,
        height: 0,
        weight: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return profile;
  }

  async findManyOrCreate(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return [];

    const profiles = await this.firebase.batchIn<Profile>(
      'uid',
      ids,
      this.collection(),
    );

    const existingIds = profiles.map((p) => p.uid);
    const missingIds = ids.filter((id) => !existingIds.includes(id));
    const { users } = await this.firebase.auth.getUsers(
      missingIds.map((uid) => ({ uid })),
    );

    if (missingIds.length > 0) {
      const operations: BatchSetOperation<Profile>[] = [];
      missingIds.forEach((uid) => {
        const user = users.find((u) => u.uid === uid);
        if (!user || !user.email) return;

        const profile = { uid, email: user.email, height: 0, weight: 0 };
        profiles.push({
          ...profile,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        operations.push({
          operation: 'set',
          ref: this.doc(uid),
          data: this.firebase.buildCreateQuery(profile, { timestamps: true }),
        });
      });

      await this.firebase.paginateBatches(operations);
    }

    return profiles;
  }

  async save(input: Create<Profile>) {
    const query = this.firebase.buildCreateQuery<Profile>(input, {
      timestamps: true,
    });

    await this.doc(input.uid).set(query);
    return input.uid;
  }

  async update(uid: string, input: Update<Profile>) {
    const query = this.firebase.buildUpdateQuery(input);
    await this.doc(uid).update(query);
  }

  async delete(uid: string) {
    await this.doc(uid).update({ deletedAt: Timestamp.now() });
  }
}
