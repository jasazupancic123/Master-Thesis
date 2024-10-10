import { Injectable } from '@nestjs/common';
import {
  FirestoreCollectionRepository,
  UserRef,
  WellnessRef,
} from '../../common/type/firebase-firestore.type';
import { Wellness } from '../entity/wellness.entity';
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

@Injectable()
export class WellnessRepository
  implements FirestoreCollectionRepository<Wellness, WellnessRef>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly userRepository: UserRepository,
  ) {}

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

  async getToday(ref: Required<UserRef>): Promise<Wellness | null> {
    const snapshot = await this.collection(ref)
      .where('createdAt', '>=', Timestamp.fromDate(startOfDay(new Date())))
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.serialize(snapshot.docs[0]);
  }

  async addDoc(
    ref: Required<UserRef>,
    input: Partial<Wellness>,
  ): Promise<string> {
    const document = await this.collection(ref).add({
      sleep: input.sleep || null,
      fatigue: input.fatigue || null,
      soreness: input.soreness || null,
      comment: input.comment || null,
      date: Timestamp.now(),
      deletedAt: null,
    });

    return document.id;
  }

  async updateDoc(
    ref: Required<WellnessRef>,
    input: Partial<Wellness>,
  ): Promise<void> {
    const data = this.commonService.object.clean(input);
    await this.doc(ref).update({
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteDoc(ref: Required<WellnessRef>): Promise<void> {
    await this.doc(ref).update({ deletedAt: Timestamp.now() });
  }

  doc(ref: Required<WellnessRef>) {
    return this.collection(ref).doc(ref.wellnessId);
  }

  collection(ref: UserRef) {
    return this.userRepository
      .doc(ref.uid)
      .collection(FirestoreCollection.WELLNESS);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Wellness {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      date: (data.date as Timestamp).toDate(),
      sleep: data.sleep || null,
      fatigue: data.fatigue || null,
      soreness: data.soreness || null,
      comment: data.comment || null,
    };
  }
}
