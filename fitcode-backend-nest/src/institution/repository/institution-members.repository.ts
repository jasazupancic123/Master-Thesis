import { Injectable } from '@nestjs/common';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  FieldValue,
  Query,
} from 'firebase-admin/firestore';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  InstitutionMemberRef,
  InstitutionRef,
} from '@src/common/type/firestore.type';
import { BatchOperation } from '@src/common/type/orm.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Institution } from '../entity/institution.entity';
import { InstitutionMember } from '../entity/institution-member.entity';

@Injectable()
export class InstitutionMembersRepository extends FirestoreRepository<
  InstitutionMember,
  InstitutionMemberRef
> {
  collectionName = FirestoreCollection.INSTITUTION_MEMBERS;

  constructor(readonly firebase: FirebaseService) {
    super(firebase);
  }

  parent(ref: InstitutionRef): DocumentReference {
    return this.firebase.firestore
      .collection(FirestoreCollection.INSTITUTION)
      .doc(ref.institutionId);
  }

  collection(ref: InstitutionRef): CollectionReference {
    return this.parent(ref).collection(this.collectionName);
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
      { id: ref.uid, institutionId: ref.institutionId, role: data.role },
      { timestamps: true },
    );

    await this.firebase.paginateBatches<unknown>([
      { operation: 'set', ref: this.doc(ref), data: query }, // add institution member to subcollection
      {
        // add to institution entity's members array
        operation: 'update',
        ref: this.parent(ref),
        data: {
          members: FieldValue.arrayUnion({ id: ref.uid, role: data.role }),
        },
      },
    ]);

    return ref.uid;
  }

  async update(ref: InstitutionMemberRef, data: Partial<InstitutionMember>) {
    const query = this.firebase.buildUpdateQuery(data);
    await this.doc(ref).update(query);
  }

  async delete(ref: InstitutionMemberRef & { role: UserRole }) {
    await this.firebase.paginateBatches([
      { operation: 'delete', ref: this.doc(ref) }, // remove institution member from subcollection
      {
        // remove from institution entity's members array
        operation: 'update',
        ref: this.parent(ref),
        data: {
          members: FieldValue.arrayRemove({ id: ref.uid, role: ref.role }),
        },
      },
    ]);
  }

  async addMember(
    data: Pick<InstitutionMember, 'role'>,
    ref: InstitutionMemberRef,
  ) {
    return await this.save(data, ref);
  }

  async removeMember(ref: InstitutionMemberRef, role: UserRole) {
    return await this.delete({ ...ref, role });
  }

  getAddMembersOperation(
    ref: InstitutionRef,
    data: Create<Omit<InstitutionMember, 'institutionId'>>[],
  ): BatchOperation<InstitutionMember | Institution>[] {
    const { institutionId } = ref;
    return data.flatMap((member) => {
      const subDocRef = this.doc({ institutionId, uid: member.id });
      const parentRef = this.parent(ref);

      return [
        {
          operation: 'set',
          ref: subDocRef,
          data: this.firebase.buildCreateQuery<InstitutionMember>(
            { id: member.id, role: member.role, institutionId },
            { timestamps: true },
          ),
        },
        {
          operation: 'update',
          ref: parentRef,
          data: {
            members: FieldValue.arrayUnion({
              id: member.id,
              role: member.role,
            }),
          } as unknown as FirestoreEntity<Partial<Institution>>,
        },
      ];
    });
  }

  getRemoveMembersOperation(
    ref: InstitutionRef,
    uids: string[],
    role: UserRole,
  ): BatchOperation<InstitutionMember | Institution>[] {
    const { institutionId } = ref;
    return uids.flatMap((uid) => {
      const subDocRef = this.doc({ institutionId, uid });
      const parentRef = this.parent(ref);

      return [
        { operation: 'delete', ref: subDocRef },
        {
          operation: 'update',
          ref: parentRef,
          data: {
            members: FieldValue.arrayRemove({ id: uid, role }),
          } as unknown as FirestoreEntity<Partial<Institution>>,
        },
      ];
    });
  }
}
