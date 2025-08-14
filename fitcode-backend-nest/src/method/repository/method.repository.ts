import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import { RootFirestoreCollectionRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Method } from '../entity/method.entity';

@Injectable()
export class MethodRepository
  implements RootFirestoreCollectionRepository<Method>
{
  constructor(private readonly firebaseService: FirebaseService) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Method[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Method>),
    );
  }

  async getDoc(id: string): Promise<Method | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Method>,
    );
  }

  async addDoc(input: Create<Method>): Promise<string> {
    if (!input.name) throw new BadRequestException('Method must have a name');

    if (!input.componentId)
      throw new BadRequestException('Method must have a componentId');

    const query = this.firebaseService.buildCreateQuery<Method>({
      id: input.id,
      name: input.name,
      componentId: input.componentId,
      ability: input.ability,
      intensity: input.intensity,
      attributes: input.attributes,
      repetition: input.repetition,
      set: input.set,
      tempo: input.tempo,
      recovery: input.recovery,
    });

    await this.doc(input.id).set(query);
    return input.id;
  }

  async updateDoc(id: string, input: Update<Method>) {
    const query = this.firebaseService.buildUpdateQuery<Method>({
      name: input.name,
      componentId: input.componentId,
      ability: input.ability,
      intensity: input.intensity,
      attributes: input.attributes,
      tempo: input.tempo,
      repetition: input.repetition,
      set: input.set,
      recovery: input.recovery,
    });

    await this.doc(id).update(query);
  }

  async deleteDoc(id: string) {
    await this.doc(id).delete();
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.METHOD,
    );
  }
}
