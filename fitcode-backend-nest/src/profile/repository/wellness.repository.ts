import { Inject, Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';

import { ChangeLogManager } from '@src/change-log/change-log.manager';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { FirestoreEntity } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  UserRef,
  WellnessRef,
} from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { Wellness } from '../entity/wellness.entity';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class WellnessRepository extends FirestoreRepository<
  Wellness,
  WellnessRef
> {
  collectionName = FirestoreCollection.WELLNESS;

  constructor(
    readonly firebaseService: FirebaseService,
    private readonly parentRepository: ProfileRepository,
    @Inject(Wellness)
    readonly changeLog: ChangeLogManager<Wellness>,
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
    const query = this.firebaseService.buildCreateQuery<Wellness>(
      { ...input, date: startOfDay(ref.date) },
      { timestamps: true },
    );

    const docRef = this.doc(ref);
    this.changeLog.trackCreate(docRef);
    await docRef.set(query);

    return this.getKey(ref);
  }

  async update(ref: WellnessRef, input: Wellness): Promise<void> {
    const query = this.firebaseService.buildUpdateQuery(input);
    const docRef = this.doc(ref);
    await this.changeLog.trackUpdate(docRef);
    await docRef.update(query);
  }

  async delete(ref: WellnessRef): Promise<void> {
    const docRef = this.doc(ref);
    await this.changeLog.trackDelete(docRef);
    await docRef.delete();
  }

  async getLatestByUser(ref: UserRef): Promise<Wellness | null> {
    const snapshot = await this.collection(ref)
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.firebaseService.serialize(
      snapshot.docs[0].data() as FirestoreEntity<Wellness>,
    );
  }

  /**
   * Bodyweight can be empty in wellness entries, so we need to find the latest entry that has it set.
   */
  async getLastBodyweight(ref: UserRef): Promise<number | null> {
    const snapshot = await this.collection(ref)
      .where('weight', '>', 0)
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return this.firebaseService.serialize(
      snapshot.docs[0].data() as FirestoreEntity<Wellness>,
    ).weight!;
  }
}
