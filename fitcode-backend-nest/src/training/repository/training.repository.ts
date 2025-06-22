import { BadRequestException, Injectable } from '@nestjs/common';
import { addHours, addMinutes, endOfHour, startOfHour } from 'date-fns';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { RootFirestoreCollectionRepository } from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Training } from '../entity/training.entity';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';

@Injectable()
export class TrainingRepository
  implements RootFirestoreCollectionRepository<Training>
{
  constructor(private readonly firebaseService: FirebaseService) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Training[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) =>
      this.firebaseService.serialize(doc.data() as FirestoreEntity<Training>),
    );
  }

  async getDoc(id: string): Promise<Training | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;

    return this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Training>,
    );
  }

  async addDoc(input: Create<Training>): Promise<string> {
    if (input.membersIds?.length === 0)
      throw new BadRequestException('Training must have atleast one member');

    if (input.components?.length === 0)
      throw new BadRequestException('Training must have atleast one component');

    const { id } = this.collection().doc();
    const query = this.firebaseService.buildCreateQuery<Training>(
      {
        id,
        groupId: input.groupId,
        cycleId: input.cycleId,
        ownerId: input.ownerId,
        from: input.from,
        to: addMinutes(startOfHour(input.from), input.components.length * 30),
        membersIds: input.membersIds || [],
        copiedFromId: input.copiedFromId || null,
        stats: input.stats || [],
        futureStats: input.futureStats || [],
        wellness: input.wellness || [],
        completedMembersIds: input.completedMembersIds || [],
        warmup: {
          id: WARMUP_COMPONENT_ID,
          color: input.warmup.color || null,
          from: input.warmup.from,
          to: input.warmup.to,
          supersets: [{ color: null, exercises: [] }],
          subgroups: [],
          completedMembersIds: [],
        },
        cooldown: {
          id: COOLDOWN_COMPONENT_ID,
          color: input.cooldown.color || null,
          from: input.cooldown.from,
          to: input.cooldown.to,
          supersets: [{ color: null, exercises: [] }],
          subgroups: [],
          completedMembersIds: [],
        },
        components: input.components.map((c, i) => ({
          id: c.id,
          color: c.color || null,
          from: c.from ? c.from : startOfHour(addHours(new Date(), i + 1)),
          to: c.to ? c.to : endOfHour(addHours(new Date(), i + 1)),
          supersets: [{ color: null, exercises: [] }],
          subgroups: [],
          target: c.target || null,
          methodId: c.methodId || null,
          completedMembersIds: [],
        })),
      },
      { timestamps: true },
    );

    await this.doc(id).set(query);
    return id;
  }

  async updateDoc(id: string, input: Update<Training>) {
    const query = this.firebaseService.buildUpdateQuery<Training>({
      from: input.from,
      components: input.components?.map((c) => ({
        id: c.id,
        from: c.from,
        to: c.to,
        target: c.target || null,
        methodId: c.methodId || null,
        color: c.color,
        completedMembersIds: c.completedMembersIds,
        subgroups: c.subgroups.map((s) => ({
          id: s.id,
          name: s.name,
          membersIds: s.membersIds,
          futureStats: s.futureStats || [],
          supersets: s.supersets.map((s) => ({
            color: s.color,
            exercises: s.exercises.map((e) => ({
              id: e.id,
              color: e.color,
              params: { ...e.params },
              sets: e.sets.map((s) => ({ ...s })),
              periodized: e.periodized,
              attributeRanges: e.attributeRanges.map((m) => ({ ...m })),
            })),
          })),
        })),
        supersets: c.supersets.map((s) => ({
          color: s.color,
          exercises: s.exercises.map((e) => ({
            id: e.id,
            color: e.color,
            params: { ...e.params },
            sets: e.sets.map((s) => ({ ...s })),
            periodized: e.periodized,
            attributeRanges: e.attributeRanges.map((m) => ({ ...m })),
          })),
        })),
      })),
    });

    await this.doc(id).update(query);
  }

  async deleteDoc(id: string) {
    await this.doc(id).delete();
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(
      FirestoreCollection.TRAINING,
    );
  }
}
