import { Injectable } from '@nestjs/common';
import { startOfDay, subDays } from 'date-fns';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { FirestoreEntity } from '@src/common/type/entity.type';
import {
  FirestoreRepository,
  UserRef,
  WellnessRef,
} from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';

import { Wellness } from '../entity/wellness.entity';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class WellnessRepository extends FirestoreRepository<
  Wellness,
  WellnessRef
> {
  collectionName = FirestoreCollection.WELLNESS;

  constructor(
    readonly firebase: FirebaseService,
    private readonly parent: ProfileRepository,
  ) {
    super(firebase);
  }

  getKey(ref: WellnessRef): string {
    return startOfDay(ref.date).toISOString().split('T')[0]; // "YYYY-MM-DD" -> today's date
  }

  collection(ref: UserRef) {
    return this.parent.doc(ref.uid).collection(FirestoreCollection.WELLNESS);
  }

  collectionGroup() {
    return this.firebase.firestore.collectionGroup(this.collectionName);
  }

  doc(ref: WellnessRef) {
    return this.collection(ref).doc(this.getKey(ref));
  }

  async findAllByInstitution(
    institution: Institution,
    range?: DateFilterDto,
  ): Promise<Wellness[]> {
    const {
      from = subDays(startOfDay(new Date()), 10), // default to 10 days ago
      to = startOfDay(new Date()), // default to now
    } = range || {};

    await this.parent.findManyOrCreate(institution.athleteIds);
    return await this.firebase.batchIn<Wellness>(
      'userId',
      institution.athleteIds,
      this.collectionGroup(),
      (q) => q.where('date', '>=', from).where('date', '<=', to),
    );
  }

  async save(
    input: Omit<Wellness, 'userId' | 'date'>,
    ref: WellnessRef,
  ): Promise<string> {
    const query = this.firebase.buildCreateQuery<Wellness>(
      { ...input, date: startOfDay(ref.date), userId: ref.uid },
      { timestamps: true },
    );

    const docRef = this.doc(ref);
    await docRef.set(query);

    return this.getKey(ref);
  }

  async update(ref: WellnessRef, input: Wellness): Promise<void> {
    const query = this.firebase.buildUpdateQuery(input);
    const docRef = this.doc(ref);
    await docRef.update(query);
  }

  async delete(ref: WellnessRef): Promise<void> {
    const docRef = this.doc(ref);
    await docRef.delete();
  }

  async getLatestByUser(ref: UserRef): Promise<Wellness | null> {
    const snapshot = await this.collection(ref)
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.firebase.serialize(
      snapshot.docs[0].data() as FirestoreEntity<Wellness>,
    );
  }

  async getAllByUser(ref: UserRef): Promise<Wellness[]> {
    const snapshot = await this.collection(ref).orderBy('date', 'desc').get();
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) =>
      this.firebase.serialize(doc.data() as FirestoreEntity<Wellness>),
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

    return this.firebase.serialize(
      snapshot.docs[0].data() as FirestoreEntity<Wellness>,
    ).weight!;
  }
}
