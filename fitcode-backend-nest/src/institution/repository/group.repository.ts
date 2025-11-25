import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  FieldValue,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  GroupRef,
  InstitutionRef,
  UserRef,
} from '@src/common/type/firestore.type';
import { BatchWriteOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Cycle } from '../entity/cycle.entity';
import { Group } from '../entity/group.entity';
import { InstitutionRepository } from './institution.repository';

@Injectable()
export class GroupRepository extends FirestoreRepository<Group, GroupRef> {
  collectionName = FirestoreCollection.GROUP;
  private _parent?: InstitutionRepository;

  constructor(
    readonly firebase: FirebaseService,
    private readonly moduleRef: ModuleRef,
  ) {
    super(firebase);
  }

  get parent(): InstitutionRepository {
    if (!this._parent)
      this._parent = this.moduleRef.get(InstitutionRepository, {
        strict: false,
      });

    return this._parent;
  }

  collection(ref: InstitutionRef): CollectionReference {
    return this.parent.doc(ref.institutionId).collection(this.collectionName);
  }

  collectionGroup(): CollectionGroup {
    return this.firebase.firestore.collectionGroup(this.collectionName);
  }

  doc(ref: GroupRef): DocumentReference {
    return this.collection(ref).doc(ref.groupId);
  }

  async getAllByInstitution(ref: InstitutionRef): Promise<Group[]> {
    const snapshot = await this.collection(ref).get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(doc.data() as FirestoreEntity<Group>),
    );
  }

  async getAllByAthlete(ref: InstitutionRef & UserRef) {
    const query = this.collection(ref).where(
      'membersIds',
      'array-contains',
      ref.uid,
    );

    const snapshot = await query.get();
    return snapshot.docs.map((doc) =>
      this.firebase.serialize(doc.data() as FirestoreEntity<Group>),
    );
  }

  async save(input: Create<Group>) {
    const { id } = this.collection({
      institutionId: input.institutionId,
    }).doc();

    const query = this.firebase.buildCreateQuery<Group>(
      {
        id,
        name: input.name,
        trainerIds: input.trainerIds,
        membersIds: input.membersIds,
        institutionId: input.institutionId,
        cycles: input.cycles,
      },
      { timestamps: true },
    );

    const ref = this.doc({ groupId: id, institutionId: input.institutionId });
    await ref.set(query);
    return id;
  }

  async update(ref: GroupRef, input: Update<Group>) {
    const query = this.firebase.buildUpdateQuery<Group>({
      name: input.name,
      cycles: input.cycles,
      trainerIds: input.trainerIds,
    });

    const docRef = this.doc(ref);
    await docRef.update(query);
  }

  async delete(ref: GroupRef) {
    const docRef = this.doc(ref);
    await docRef.delete();
  }

  async addTrainer(ref: GroupRef, trainerId: string) {
    const docRef = this.doc(ref);
    await docRef.update({ trainerIds: FieldValue.arrayUnion(trainerId) });
  }

  async removeTrainer(ref: GroupRef, trainerId: string) {
    const docRef = this.doc(ref);
    await docRef.update({ trainerIds: FieldValue.arrayRemove(trainerId) });
  }

  async addMember(ref: GroupRef, memberId: string) {
    const docRef = this.doc(ref);
    await docRef.update({ membersIds: FieldValue.arrayUnion(memberId) });
  }

  async removeMember(ref: GroupRef, memberId: string) {
    const docRef = this.doc(ref);
    await docRef.update({ membersIds: FieldValue.arrayRemove(memberId) });
  }

  getUpdateMemberOperation(
    ref: GroupRef,
    memberId: string,
    add: boolean,
  ): BatchWriteOperation<Group> {
    return {
      ref: this.doc(ref),
      operation: 'update',
      data: {
        membersIds: add
          ? (FieldValue.arrayUnion(memberId) as unknown as string[])
          : (FieldValue.arrayRemove(memberId) as unknown as string[]),
      },
    };
  }

  async addCycle(group: Group, cycle: Create<Cycle>) {
    const ref = this.doc({
      institutionId: group.institutionId,
      groupId: group.id,
    });

    const query = this.firebase.buildUpdateQuery<Group>({
      cycles: [
        ...group.cycles,
        { ...cycle, createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    await ref.update(query);
  }

  async removeCycle(group: Group, cycleId: string) {
    const ref = this.doc({
      institutionId: group.institutionId,
      groupId: group.id,
    });

    const cycles = group.cycles.filter((cycle) => cycle.id !== cycleId);
    const query = this.firebase.buildUpdateQuery<Group>({
      cycles: cycles,
    });

    await ref.update(query);
  }
}
