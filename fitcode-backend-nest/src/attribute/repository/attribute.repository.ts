import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { RootFirestoreCollectionRepository } from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Attribute } from '../entity/attribute.entity';

@Injectable()
export class AttributeRepository
  implements RootFirestoreCollectionRepository<Attribute>
{
  constructor(private readonly firebaseService: FirebaseService) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Attribute[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Attribute>),
    );
  }

  async getDoc(slug: string): Promise<Attribute | null> {
    const snapshot = await this.doc(slug).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Attribute>,
    );
  }

  async addDoc(input: Create<Attribute>) {
    const query = this.firebaseService.buildCreateQuery<Attribute>(input);
    await this.doc(input.field).set(query);
    return input.field;
  }

  async updateDoc(slug: string, input: Update<Attribute>) {
    const query = this.firebaseService.buildUpdateQuery(input);
    await this.doc(slug).update(query);
  }

  async deleteDoc(slug: string) {
    await this.doc(slug).delete();
  }

  doc(slug: string): DocumentReference {
    return this.collection().doc(slug);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.ATTRIBUTE,
    );
  }
}
