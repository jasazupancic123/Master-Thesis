import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Profile } from '../entity/profile.entity';

@Injectable()
export class ProfileRepository extends FirestoreRepository<Profile> {
  collectionName = FirestoreCollection.USER;

  constructor(readonly firebaseService: FirebaseService) {
    super(firebaseService);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(this.collectionName);
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  async save(input: Partial<Profile>) {
    if (!input.id) throw new Error('User ID is required');

    const query = this.firebaseService.buildCreateQuery<Profile>(
      { id: input.id },
      { timestamps: true },
    );

    await this.doc(input.id).set(query);
    return input.id;
  }

  async update(id: string, input: Update<Profile>) {
    const query = this.firebaseService.buildUpdateQuery(input);
    await this.doc(id).update(query);
  }

  async delete(id: string) {
    await this.doc(id).update({ deletedAt: Timestamp.now() });
  }
}
