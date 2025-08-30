import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Attribute } from '../entity/attribute.entity';

@Injectable()
export class AttributeRepository extends FirestoreRepository<Attribute> {
  collectionName = FirestoreCollection.ATTRIBUTE;

  constructor(readonly firebaseService: FirebaseService) {
    super(firebaseService);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<Attribute>) {
    const query = this.firebaseService.buildCreateQuery<Attribute>(input);
    await this.doc(input.field).set(query);
    return input.field;
  }

  async update(slug: string, input: Update<Attribute>) {
    const query = this.firebaseService.buildUpdateQuery(input);
    await this.doc(slug).update(query);
  }

  async delete(slug: string) {
    await this.doc(slug).delete();
  }
}
