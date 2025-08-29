import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Method } from '../entity/method.entity';

@Injectable()
export class MethodRepository extends FirestoreRepository<Method> {
  collectionName = FirestoreCollection.METHOD;

  constructor(readonly firebaseService: FirebaseService) {
    super(firebaseService);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<Method>): Promise<string> {
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

  async update(id: string, input: Update<Method>) {
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

  async delete(id: string) {
    await this.doc(id).delete();
  }
}
