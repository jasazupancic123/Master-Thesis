import { Inject, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  FieldValue,
} from 'firebase-admin/firestore';

import { ChangeLogManager } from '@src/change-log/change-log.manager';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Cycle } from '../entity/cycle.entity';
import { Group } from '../entity/group.entity';

@Injectable()
export class GroupRepository extends FirestoreRepository<Group> {
  collectionName = FirestoreCollection.GROUP;

  constructor(
    readonly firebaseService: FirebaseService,
    @Inject(Group)
    readonly changeLog: ChangeLogManager<Group>,
  ) {
    super(firebaseService);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async save(input: Create<Group>) {
    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Group>(
      {
        id,
        name: input.name,
        ownerId: input.ownerId,
        membersIds: input.membersIds,
        institutionId: input.institutionId,
        cycles: input.cycles,
      },
      { timestamps: true },
    );

    const ref = this.doc(id);
    this.changeLog.trackCreate(ref);
    await ref.set(query);
    return id;
  }

  async update(id: string, input: Update<Group>) {
    const query = this.firebaseService.buildUpdateQuery<Group>({
      name: input.name,
      cycles: input.cycles,
    });

    const ref = this.doc(id);
    await this.changeLog.trackUpdate(ref);
    await ref.update(query);
  }

  async delete(id: string) {
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

  async addCycle(group: Group, cycle: Create<Cycle>) {
    const ref = this.doc(group.id);
    const query = this.firebaseService.buildUpdateQuery<Group>({
      cycles: [
        ...group.cycles,
        { ...cycle, createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    await this.changeLog.trackUpdate(ref);
    await ref.update(query);
  }

  async removeCycle(group: Group, cycleId: string) {
    const ref = this.doc(group.id);
    const cycles = group.cycles.filter((cycle) => cycle.id !== cycleId);

    const query = this.firebaseService.buildUpdateQuery<Group>({
      cycles: cycles,
    });

    await this.changeLog.trackUpdate(ref);
    await ref.update(query);
  }
}
