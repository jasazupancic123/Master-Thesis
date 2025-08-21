import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRootRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Attribute } from '../entity/attribute.entity';

@Injectable()
export class AttributeRepository extends FirestoreRootRepository<Attribute> {
  collectionName = FirestoreCollection.ATTRIBUTE;

  constructor(readonly firebaseService: FirebaseService) {
    super(firebaseService);
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
