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

import { Institution } from '../entity/institution.entity';

@Injectable()
export class InstitutionRepository extends FirestoreRepository<Institution> {
  collectionName = FirestoreCollection.INSTITUTION;

  constructor(
    readonly firebase: FirebaseService,
    @Inject(Institution)
    readonly changeLog: ChangeLogManager<Institution>,
  ) {
    super(firebase);
  }

  collection(): CollectionReference {
    return this.firebase.firestore.collection(this.collectionName);
  }

  doc(ref: string): DocumentReference {
    return this.collection().doc(ref);
  }

  async findAllByAdmin() {
    return await this.findAll();
  }

  async findAllByManager(managerId: string) {
    return await this.findAll((q) => q.where('ownerId', '==', managerId));
  }

  async findAllByTrainer(trainerId: string) {
    return await this.findAll((q) =>
      q.where('trainerIds', 'array-contains', trainerId),
    );
  }

  async findAllByAthlete(athleteId: string) {
    return await this.findAll((q) =>
      q.where('athleteIds', 'array-contains', athleteId),
    );
  }

  async save(input: Create<Institution>): Promise<string> {
    const { id } = this.collection().doc();
    const query = this.firebase.buildCreateQuery<Institution>({
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

  async update(id: string, input: Update<Institution>) {
    const query = this.firebase.buildUpdateQuery<Institution>({
      ownerId: input.ownerId,
      name: input.name,
      imageUrl: input.imageUrl,
      ...(input.athleteIds && { athleteIds: input.athleteIds }),
      ...(input.trainerIds && { trainerIds: input.trainerIds }),
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
}
