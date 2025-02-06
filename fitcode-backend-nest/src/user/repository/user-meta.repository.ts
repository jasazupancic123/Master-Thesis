import { Injectable } from '@nestjs/common';
import {
  FirestoreCollectionRepository,
  UserMetaRef,
  UserRef,
} from '../../common/type/firebase-firestore.type';
import { CommonService } from '../../common/service/common.service';
import { UserRepository } from './user.repository';
import {
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { startOfDay } from 'date-fns';
import { UserMeta } from '../entity/user-meta.entity';

@Injectable()
export class UserMetaRepository
  implements FirestoreCollectionRepository<UserMeta, UserRef>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly userRepository: UserRepository,
  ) {}

  getKey(ref: Required<UserMetaRef>): string {
    return startOfDay(ref.date).toISOString().split('T')[0]; // "YYYY-MM-DD" -> today's date
  }

  async getDocs(
    ref: Required<UserRef>,
    query: (query: Query) => Query = (query) => query,
  ): Promise<UserMeta[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(ref: Required<UserMetaRef>): Promise<UserMeta | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(
    ref: Required<UserMetaRef>,
    input: Omit<UserMeta, 'date'>,
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

  async updateDoc(ref: Required<UserMetaRef>, input: UserMeta): Promise<void> {
    await this.doc(ref).update({
      ...this.commonService.object.clean(input),
      updatedAt: Timestamp.now(),
    });
  }

  async deleteDoc(ref: Required<UserMetaRef>): Promise<void> {
    await this.doc(ref).delete();
  }

  doc(ref: Required<UserMetaRef>) {
    return this.collection(ref).doc(this.getKey(ref));
  }

  collection(ref: Required<UserRef>) {
    return this.userRepository
      .doc(ref.uid)
      .collection(FirestoreCollection.USER_META);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): UserMeta {
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
