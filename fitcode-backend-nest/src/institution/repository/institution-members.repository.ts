import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  InstitutionMemberRef,
  InstitutionRef,
} from '@src/common/type/firestore.type';
import {
  BatchDeleteOperation,
  BatchWriteOperation,
} from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { InstitutionMember } from '../entity/institution-member.entity';
import { InstitutionRepository } from './institution.repository';

@Injectable()
export class InstitutionMembersRepository extends FirestoreRepository<
  InstitutionMember,
  InstitutionMemberRef
> {
  collectionName = FirestoreCollection.INSTITUTION_MEMBERS;
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

  doc(ref: InstitutionMemberRef): DocumentReference {
    return this.collection(ref).doc(ref.uid);
  }

  async findAll(
    query: (ref: Query) => Query = (ref) => ref,
    ref: InstitutionRef,
  ): Promise<InstitutionMember[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async findAllMembers(institutionId: string): Promise<InstitutionMember[]> {
    return await this.findAll((q) => q, { institutionId });
  }

  async findInstitutionIdsByMember(uid: string): Promise<string[]> {
    const snapshot = await this.collectionGroup().where('id', '==', uid).get();
    const members = snapshot.docs.map((doc) => this.serialize(doc));
    return Array.from(new Set(members.map((m) => m.institutionId)));
  }

  async save(data: Pick<InstitutionMember, 'role'>, ref: InstitutionMemberRef) {
    const query = this.firebase.buildCreateQuery<InstitutionMember>(
      { id: ref.uid, institutionId: ref.institutionId, ...data },
      { timestamps: true },
    );

    await this.doc(ref).set(query);
    return ref.uid;
  }

  async update(ref: InstitutionMemberRef, data: Partial<InstitutionMember>) {
    const query = this.firebase.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async delete(ref: InstitutionMemberRef) {
    await this.doc(ref).delete();
  }

  async addMember(
    data: Pick<InstitutionMember, 'role'>,
    ref: InstitutionMemberRef,
  ) {
    return await this.save(data, ref);
  }

  async removeMember(ref: InstitutionMemberRef) {
    return await this.delete(ref);
  }

  getAddMembersOperation(
    ref: InstitutionRef,
    data: Create<Omit<InstitutionMember, 'institutionId'>>[],
  ): BatchWriteOperation<InstitutionMember>[] {
    const { institutionId } = ref;
    return data.map((member) => ({
      operation: 'set',
      ref: this.doc({ institutionId, uid: member.id }),
      data: this.firebase.buildCreateQuery<InstitutionMember>(
        { institutionId, id: member.id, role: member.role },
        { timestamps: true },
      ),
    }));
  }

  getRemoveMembersOperation(
    ref: InstitutionRef,
    uids: string[],
  ): BatchDeleteOperation[] {
    const { institutionId } = ref;
    return uids.map((uid) => ({
      operation: 'delete',
      ref: this.doc({ institutionId, uid }),
    }));
  }
}
