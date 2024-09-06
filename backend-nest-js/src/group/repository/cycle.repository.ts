import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference, Query, Timestamp } from 'firebase-admin/firestore';
import { CycleRef, FirestoreCollectionRepository, GroupRef } from '../../common/type/firebase-firestore.type';
import { Cycle } from '../entity/cycle.entity';
import { GroupRepository } from './group.repository';
import { CommonService } from '../../common/service/common.service';
import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/lib/firestore';

@Injectable()
export class CycleRepository implements FirestoreCollectionRepository<Cycle, CycleRef> {
  constructor(
    private readonly commonService: CommonService,
    private readonly groupRepository: GroupRepository,
  ) {
  }

  async getDocs(
    ref: Required<GroupRef>,
    query: (query: Query) => Query = query => query,
  ): Promise<Cycle[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  async getDoc(ref: Required<CycleRef>): Promise<Cycle | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(ref: Required<GroupRef>, input: Partial<Cycle>): Promise<string> {
    const result = await this.collection(ref).add({
      name: input.name,
      description: input.description || null,
      from: Timestamp.fromDate(input.from),
      to: Timestamp.fromDate(input.to),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return result.id;
  }

  async updateDoc(ref: Required<CycleRef>, input: Partial<Cycle>) {
    const data = this.commonService.object.clean(input);
    await this.doc(ref).update(data);
  }

  doc(ref: Required<CycleRef>): DocumentReference {
    return this.collection(ref).doc(ref.cycleId);
  }

  collection(ref: Required<GroupRef>): CollectionReference {
    return this.groupRepository.doc(ref).collection(FirestoreCollection.CYCLE);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Cycle {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      name: data.name,
      description: data.description || null,
      from: (data.from as Timestamp).toDate(),
      to: (data.to as Timestamp).toDate(),
      trainings: [],
      weeks: [],
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as Cycle;
  }
}