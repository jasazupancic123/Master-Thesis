import { BadRequestException, Injectable } from '@nestjs/common';
import { RootFirestoreCollectionRepository } from '../../common/type/firestore.type';
import { Method } from '../entity/method.entity';
import { FirebaseService } from '../../firebase/firebase.service';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

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

    if (!input.targetId)
      throw new BadRequestException('Method must have a targetId');

    const query = this.firebaseService.buildCreateQuery<Method>({
      id: input.id,
      name: input.name,
      targetId: input.targetId,
      ability: input.ability,
      repetition: input.repetition,
      intensity: input.intensity,
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
      targetId: input.targetId,
      ability: input.ability,
      repetition: input.repetition,
      intensity: input.intensity,
      set: input.set,
      tempo: input.tempo,
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
