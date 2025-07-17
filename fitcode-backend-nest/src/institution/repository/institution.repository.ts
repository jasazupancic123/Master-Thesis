import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import { RootFirestoreCollectionRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Institution } from '../entity/institution.entity';

@Injectable()
export class InstitutionRepository
  implements RootFirestoreCollectionRepository<Institution>
{
  constructor(private readonly firebaseService: FirebaseService) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Institution[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(
        doc.data() as FirestoreEntity<Institution>,
      ),
    );
  }

  async getDoc(id: string): Promise<Institution | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Institution>,
    );
  }

  async addDoc(input: Create<Institution>): Promise<string> {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Institution>({
      id,
      ownerId: input.ownerId,
      trainerIds: input.trainerIds || [],
      athleteIds: input.athleteIds || [],
      name: input.name,
      imageUrl: input.imageUrl,
    });

    await this.doc(id).set(query);
    return id;
  }

  async updateDoc(id: string, input: Update<Institution>) {
    const query = this.firebaseService.buildUpdateQuery<Institution>({
      ownerId: input.ownerId,
      trainerIds: input.trainerIds,
      athleteIds: input.athleteIds,
      name: input.name,
      imageUrl: input.imageUrl,
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
      FirestoreCollection.INSTITUTION,
    );
  }
}
