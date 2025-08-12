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

import { Training } from '../entity/training.entity';

@Injectable()
export class TrainingRepository
  implements RootFirestoreCollectionRepository<Training>
{
  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(Training)
    readonly changeLog: ChangeLogManager<Training>,
  ) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Training[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Training>),
    );
  }

  async getDoc(id: string): Promise<Training | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Training>,
    );
  }

  async addDoc(input: Create<Training>): Promise<string> {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Training>(
      { ...input, id },
      { timestamps: true },
    );

    const ref = this.doc(id);
    this.changeLog.trackCreate(ref);
    await ref.set(query);

    return id;
  }

  async updateDoc(id: string, input: Update<Training>) {
    const query = this.firebaseService.buildUpdateQuery<Training>(input);
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update(query);
  }

  async deleteDoc(id: string) {
    const ref = this.doc(id);
    await this.changeLog.trackDelete(ref);
    await ref.delete();
  }

  async addMember(id: string, memberId: string) {
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update({ membersIds: FieldValue.arrayUnion(memberId) });
  }

  async removeMember(id: string, memberId: string) {
    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update({ membersIds: FieldValue.arrayRemove(memberId) });
  }

  getUpdateMemberOperation(
    id: string,
    memberId: string,
    add: boolean,
  ): BatchWriteOperation<Training> {
    return {
      ref: this.doc(id),
      operation: 'update',
      data: {
        membersIds: add
          ? (FieldValue.arrayUnion(memberId) as unknown as string[])
          : (FieldValue.arrayRemove(memberId) as unknown as string[]),
      },
    };
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.TRAINING,
    );
  }
}
