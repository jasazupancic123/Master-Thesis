import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference, Timestamp } from 'firebase-admin/firestore';
import { CycleRef, FirestoreCollectionRepository, GroupRef } from '../../common/type/firebase-firestore.type';
import { Cycle } from '../entity/cycle.entity';
import { GroupRepository } from './group.repository';
import { CommonService } from '../../common/service/common.service';

@Injectable()
export class CycleRepository implements FirestoreCollectionRepository<Cycle, CycleRef> {
  constructor(
    private readonly commonService: CommonService,
    private readonly groupRepository: GroupRepository,
  ) {
  }

  async getDocs(
    ref: Required<GroupRef>,
    query: (query: CollectionReference) => CollectionReference = query => query,
  ): Promise<Cycle[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Cycle);
  }

  async getDoc(ref: Required<CycleRef>): Promise<Cycle | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return { id: snapshot.id, ...snapshot.data() } as Cycle;
  }

  async addDoc(ref: Required<CycleRef>, input: Cycle) {
    const result = await this.collection(ref).add({
      name: input.name,
      description: input.description || null,
      from: Timestamp.fromDate(input.from),
      to: Timestamp.fromDate(input.to),
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
    return this.groupRepository.collection().doc(ref.groupId).collection(FirestoreCollection.CYCLE);
  }
}