import { Injectable } from '@nestjs/common';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import {
  FirestoreRepository,
  UserExerciseStatsRef,
  UserRef,
} from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { ProfileRepository } from '@src/user/repository/profile.repository';

import { UserExerciseStats } from '../entity/user-exercise-stats.entity';

@Injectable()
export class UserExerciseStatsRepository extends FirestoreRepository<
  UserExerciseStats,
  UserExerciseStatsRef
> {
  collectionName = FirestoreCollection.USER_EXERCISE_STATS;

  constructor(
    readonly firebase: FirebaseService,
    private readonly parent: ProfileRepository,
  ) {
    super(firebase);
  }

  getKey(ref: UserExerciseStatsRef): string {
    return `${ref.uid}-${ref.exerciseId}`;
  }

  collection(ref: UserRef) {
    return this.parent.doc(ref.uid).collection(this.collectionName);
  }

  collectionGroup() {
    return this.firebase.firestore.collectionGroup(this.collectionName);
  }

  doc(ref: UserExerciseStatsRef) {
    return this.collection(ref).doc(this.getKey(ref));
  }

  async save(input: UserExerciseStats): Promise<string> {
    const query = this.firebase.buildCreateQuery<UserExerciseStats>({
      userId: input.userId,
      exerciseId: input.exerciseId,
      timestamp: input.timestamp,
      repMax: input.repMax,
    });

    const ref: UserExerciseStatsRef = {
      uid: input.userId,
      exerciseId: input.exerciseId,
    };

    const docRef = this.doc(ref);
    await docRef.set(query);
    return this.getKey(ref);
  }

  async update(
    ref: UserExerciseStatsRef,
    input: Partial<UserExerciseStats>,
  ): Promise<void> {
    const query = this.firebase.buildUpdateQuery(input);
    const docRef = this.doc(ref);
    await docRef.update(query);
  }

  async delete(ref: UserExerciseStatsRef): Promise<void> {
    const docRef = this.doc(ref);
    await docRef.delete();
  }
}
