import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import {
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import {
  FirestoreCollectionRepository,
  UserRef,
  WellnessRef,
} from '@src/common/type/firestore.type';

import { Wellness } from '../entity/wellness.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class WellnessRepository
  implements FirestoreCollectionRepository<Wellness, UserRef>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly userRepository: UserRepository,
  ) {}

  getKey(ref: Required<WellnessRef>): string {
    return startOfDay(ref.date).toISOString().split('T')[0]; // "YYYY-MM-DD" -> today's date
  }

  async getDocs(
    ref: Required<UserRef>,
    query: (query: Query) => Query = (query) => query,
  ): Promise<Wellness[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(ref: Required<WellnessRef>): Promise<Wellness | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(
    ref: Required<WellnessRef>,
    input: Omit<Wellness, 'date'>,
  ): Promise<string> {
    await this.doc(ref).set({
      userId: ref.uid,
      date: startOfDay(ref.date),
      weight: input.weight || null,
      sleep: input.sleep || null,
      fatigue: input.fatigue || null,
      soreness: input.soreness || null,
      comment: input.comment || null,
    });

    return this.getKey(ref);
  }

  async updateDoc(ref: Required<WellnessRef>, input: Wellness): Promise<void> {
    await this.doc(ref).update({
      ...this.commonService.object.clean(input),
      updatedAt: Timestamp.now(),
    });
  }

  async deleteDoc(ref: Required<WellnessRef>): Promise<void> {
    await this.doc(ref).delete();
  }

  doc(ref: Required<WellnessRef>) {
    return this.collection(ref).doc(this.getKey(ref));
  }

  collection(ref: Required<UserRef>) {
    return this.userRepository
      .doc(ref.uid)
      .collection(FirestoreCollection.WELLNESS);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Wellness {
    const data = snapshot.data();

    return {
      userId: data.userId,
      date: (data.date as Timestamp).toDate(),
      weight: data.weight || null,
      sleep: data.sleep || null,
      fatigue: data.fatigue || null,
      soreness: data.soreness || null,
      comment: data.comment || null,
    };
  }
}
