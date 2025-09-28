import {
  CollectionReference,
  DocumentReference,
} from '@google-cloud/firestore';
import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { MigrationEntity } from './migration.interface';

@Injectable()
export class MigrationRepository extends FirestoreRepository<MigrationEntity> {
  collectionName = FirestoreCollection.MIGRATION;

  constructor(readonly firebase: FirebaseService) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<MigrationEntity>): Promise<string> {
    const query = this.firebase.buildCreateQuery<MigrationEntity>(input);
    const ref = this.doc(input.id);
    await ref.set(query);
    return input.id;
  }

  async update(_: string, __: Partial<MigrationEntity>) {
    throw new Error('Cannot update migration');
  }

  async delete(_: string) {
    throw new Error('Cannot delete migration');
  }
}
