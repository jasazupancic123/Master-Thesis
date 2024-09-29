import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase-admin/firestore';
import {
  FirestoreCollectionRepository,
  GroupRef,
  SubgroupRef,
} from '../../common/type/firebase-firestore.type';
import { Subgroup } from '../entity/subgroup.entity';
import { GroupRepository } from './group.repository';
import { CommonService } from '../../common/service/common.service';
import {
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/lib/firestore';

@Injectable()
export class SubgroupRepository
  implements FirestoreCollectionRepository<Subgroup, SubgroupRef>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly groupRepository: GroupRepository,
  ) {}

  async getDocs(
    ref: Required<GroupRef>,
    query: (query: Query) => Query = (query) => query,
  ): Promise<Subgroup[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(ref: Required<SubgroupRef>): Promise<Subgroup | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(ref: Required<GroupRef>, input: Partial<Subgroup>) {
    const result = await this.collection(ref).add({
      groupId: ref.groupId,
      name: input.name,
      cycleId: input.cycleId,
      membersIds: input.membersIds,
      from: Timestamp.fromDate(input.from),
      to: Timestamp.fromDate(input.to),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: null,
    });

    return result.id;
  }

  async updateDoc(ref: Required<SubgroupRef>, input: Partial<Subgroup>) {
    const data = this.commonService.object.clean(input);
    await this.doc(ref).update(data);
  }

  async deleteDoc(ref: Required<SubgroupRef>) {
    await this.doc(ref).update({ deletedAt: Timestamp.now() });
  }

  doc(ref: Required<SubgroupRef>): DocumentReference {
    return this.collection(ref).doc(ref.subgroupId);
  }

  collection(ref: Required<GroupRef>): CollectionReference {
    return this.groupRepository
      .doc(ref.groupId)
      .collection(FirestoreCollection.SUBGROUP);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Subgroup {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      name: data.name,
      cycleId: data.cycleId,
      groupId: data.groupId,
      membersIds: data.membersIds,
      members: [],
      from: (data.from as Timestamp).toDate(),
      to: (data.to as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : null,
    };
  }
}
