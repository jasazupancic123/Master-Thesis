import { Inject, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';

import { ChangeLogManager } from '@src/change-log/change-log.manager';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import {
  BatchWriteOperation,
  RootFirestoreCollectionRepository,
} from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Group } from '../entity/group.entity';

@Injectable()
export class GroupRepository
  implements RootFirestoreCollectionRepository<Group>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    @Inject(Group)
    readonly changeLog: ChangeLogManager<Group>,
  ) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Group[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(id: string): Promise<Group | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(input: Create<Group>) {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Group>(
      {
        id,
        name: input.name,
        ownerId: input.ownerId,
        membersIds: input.membersIds,
        institutionId: input.institutionId,
        cycles: [],
      },
      { timestamps: true },
    );

    const ref = this.doc(id);
    this.changeLog.trackCreate(ref);
    await ref.set(query);
    return id;
  }

  async updateDoc(id: string, input: Update<Group>) {
    const query = this.firebaseService.buildUpdateQuery<Group>({
      name: input.name,
      cycles: input.cycles,
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
  ): BatchWriteOperation<Group> {
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
    return this.firebaseService.firestore.collection(FirestoreCollection.GROUP);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Group {
    const serialized = this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Group>,
    );

    serialized.cycles = serialized.cycles
      .map((c) => ({
        ...c,
        weeks: this.commonService.date.weeks(c.from, c.to),
      }))
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

    serialized.id = snapshot.id;
    return serialized;
  }
}
