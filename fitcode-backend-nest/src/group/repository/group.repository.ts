import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  FieldValue,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Cycle } from '../entity/cycle.entity';
import { Group } from '../entity/group.entity';

@Injectable()
export class GroupRepository extends FirestoreRepository<Group> {
  collectionName = FirestoreCollection.GROUP;

  constructor(readonly firebase: FirebaseService) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async findAllByAdmin() {
    const snapshot = await this.collection().get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(doc.data() as FirestoreEntity<Group>),
    );
  }

  async findAllByInstitution(institutionId: string) {
    const query = this.collection().where('institutionId', '==', institutionId);
    const snapshot = await query.get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(doc.data() as FirestoreEntity<Group>),
    );
  }

  async findAllByInstitutions(ids: string[]) {
    return await this.firebase.batchIn<Group>(
      'institutionId',
      ids,
      this.collection(),
    );
  }

  async findAllByAthlete(athleteId: string) {
    const query = this.collection().where(
      'membersIds',
      'array-contains',
      athleteId,
    );

    const snapshot = await query.get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(doc.data() as FirestoreEntity<Group>),
    );
  }

  async save(input: Create<Group>) {
    const { id } = this.collection().doc();
    const query = this.firebase.buildCreateQuery<Group>(
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
    await ref.set(query);
    return id;
  }

  async update(id: string, input: Update<Group>) {
    const query = this.firebase.buildUpdateQuery<Group>({
      name: input.name,
      cycles: input.cycles,
    });

    const ref = this.doc(id);
    await ref.update(query);
  }

  async delete(id: string) {
    const ref = this.doc(id);
    await ref.delete();
  }

  async addMember(id: string, memberId: string) {
    const ref = this.doc(id);
    await ref.update({ membersIds: FieldValue.arrayUnion(memberId) });
  }

  async removeMember(id: string, memberId: string) {
    const ref = this.doc(id);
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
    const query = this.firebase.buildUpdateQuery<Group>({
      cycles: [
        ...group.cycles,
        { ...cycle, createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    await ref.update(query);
  }

  async removeCycle(group: Group, cycleId: string) {
    const ref = this.doc(group.id);
    const cycles = group.cycles.filter((cycle) => cycle.id !== cycleId);

    const query = this.firebase.buildUpdateQuery<Group>({
      cycles: cycles,
    });

    await ref.update(query);
  }
}
