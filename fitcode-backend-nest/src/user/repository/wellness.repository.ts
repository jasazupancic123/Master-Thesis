import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import {
  FirestoreRepository,
  UserRef,
  WellnessRef,
} from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Wellness } from '../entity/wellness.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class WellnessRepository extends FirestoreRepository<
  Wellness,
  WellnessRef
> {
  collectionName = FirestoreCollection.WELLNESS;

  constructor(
    readonly firebaseService: FirebaseService,
    private readonly parentRepository: UserRepository,
  ) {
    super(firebaseService);
  }

  getKey(ref: WellnessRef): string {
    return startOfDay(ref.date).toISOString().split('T')[0]; // "YYYY-MM-DD" -> today's date
  }

  collection(ref: UserRef) {
    return this.parentRepository
      .doc(ref.uid)
      .collection(FirestoreCollection.WELLNESS);
  }

  doc(ref: WellnessRef) {
    return this.collection(ref).doc(this.getKey(ref));
  }

  async save(input: Omit<Wellness, 'date'>, ref: WellnessRef): Promise<string> {
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

  async update(ref: WellnessRef, input: Wellness): Promise<void> {
    const query = this.firebaseService.buildUpdateQuery(input);
    await this.doc(ref).update(query);
  }

  async delete(ref: WellnessRef): Promise<void> {
    await this.doc(ref).delete();
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
