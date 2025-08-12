import { Inject, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  FieldValue,
  Query,
} from 'firebase-admin/firestore';

import { ChangeLogManager } from '@src/change-log/change-log.manager';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import {
  BatchWriteOperation,
  RootFirestoreCollectionRepository,
} from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Institution } from '../entity/institution.entity';

@Injectable()
export class InstitutionRepository
  implements RootFirestoreCollectionRepository<Institution>
{
  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(Institution)
    readonly changeLog: ChangeLogManager<Institution>,
  ) {}

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

    const ref = this.doc(id);
    this.changeLog.trackCreate(ref);
    await ref.set(query);

    return id;
  }

  async updateDoc(id: string, input: Update<Institution>) {
    const query = this.firebaseService.buildUpdateQuery<Institution>({
      ownerId: input.ownerId,
      name: input.name,
      imageUrl: input.imageUrl,
    });

    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update(query);
  }

  async deleteDoc(id: string) {
    const ref = this.doc(id);
    await this.changeLog.trackDelete(ref);
    await ref.delete();
  }

  async addTrainer(id: string, trainerId: string) {
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update({ trainerIds: FieldValue.arrayUnion(trainerId) });
  }

  async removeTrainer(id: string, trainerId: string) {
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update({ trainerIds: FieldValue.arrayRemove(trainerId) });
  }

  async addAthlete(id: string, athleteId: string) {
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update({ athleteIds: FieldValue.arrayUnion(athleteId) });
  }

  async removeAthlete(id: string, athleteId: string) {
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update({ athleteIds: FieldValue.arrayRemove(athleteId) });
  }

  getUpdateAthleteOperation(
    id: string,
    athleteId: string,
    add: boolean,
  ): BatchWriteOperation<Institution> {
    return {
      ref: this.doc(id),
      operation: 'update',
      data: {
        athleteIds: add
          ? (FieldValue.arrayUnion(athleteId) as unknown as string[])
          : (FieldValue.arrayRemove(athleteId) as unknown as string[]),
      },
    };
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
