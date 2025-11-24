import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  FieldValue,
  Query,
} from 'firebase-admin/firestore';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { Create, Update } from '@src/common/type/entity.type';
import { FirestoreRepository } from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Institution } from '../entity/institution.entity';
import { InstitutionMembersRepository } from './institution-members.repository';

@Injectable()
export class InstitutionRepository extends FirestoreRepository<Institution> {
  collectionName = FirestoreCollection.INSTITUTION;

  constructor(
    readonly firebase: FirebaseService,
    readonly members: InstitutionMembersRepository,
  ) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async findById(ref: string): Promise<Institution | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;

    const institution = this.serialize(snapshot);
    const members = await this.members.findAllMembers(institution.id);

    return {
      ...institution,
      trainerIds: members
        .filter((m) => m.role === UserRole.TRAINER)
        .map((m) => m.id),
      athleteIds: members
        .filter((m) => m.role === UserRole.ATHLETE)
        .map((m) => m.id),
    };
  }

  async findAll(
    query: (ref: Query) => Query = (ref) => ref,
  ): Promise<Institution[]> {
    const snapshot = await query(this.collection()).get();
    const institutions = snapshot.docs.map((doc) => this.serialize(doc));

    // for each institution, fetch members
    return await Promise.all(
      institutions.map(async (institution) => {
        const members = await this.members.findAllMembers(institution.id);
        return {
          ...institution,
          trainerIds: members
            .filter((m) => m.role === UserRole.TRAINER)
            .map((m) => m.id),
          athleteIds: members
            .filter((m) => m.role === UserRole.ATHLETE)
            .map((m) => m.id),
        };
      }),
    );
  }

  async findOneByManager(managerId: string) {
    return await this.findAll((q) =>
      q.where('ownerId', '==', managerId).limit(1),
    );
  }

  async findAllByMember(memberId: string): Promise<Institution[]> {
    const institutionIds =
      await this.members.findInstitutionIdsByMember(memberId);

    if (institutionIds.length === 0) return [];
    return await this.findAll((q) => q.where('id', 'in', institutionIds));
  }

  async save(
    input: Create<Omit<Institution, 'trainerIds' | 'athleteIds'>>,
  ): Promise<string> {
    const { id } = this.collection().doc();
    const query = this.firebase.buildCreateQuery<
      Omit<Institution, 'trainerIds' | 'athleteIds'>
    >({
      id,
      ownerId: input.ownerId,
      name: input.name,
      imageUrl: input.imageUrl,
    });

    const ref = this.doc(id);
    await ref.set(query);

    return id;
  }

  async update(id: string, input: Update<Institution>) {
    const query = this.firebase.buildUpdateQuery<Institution>({
      ownerId: input.ownerId,
      name: input.name,
      imageUrl: input.imageUrl,
    });

    const ref = this.doc(id);
    await ref.update(query);
  }

  async delete(id: string) {
    const ref = this.doc(id);
    await ref.delete();
  }

  async incrementExerciseRevisions(institutionId: string) {
    const ref = this.doc(institutionId);
    await ref.update({ exerciseRevisions: FieldValue.increment(1) });
  }
}
