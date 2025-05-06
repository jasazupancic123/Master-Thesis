import { BadRequestException, Injectable } from '@nestjs/common';
import { addHours, addMinutes, endOfHour, startOfHour } from 'date-fns';
import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CommonService } from '../../common/service/common.service';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { RootFirestoreCollectionRepository } from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Training } from '../entity/training.entity';
import { v4 } from 'uuid';

@Injectable()
export class TrainingRepository
  implements RootFirestoreCollectionRepository<Training>
{
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly commonService: CommonService,
  ) {}

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
        wellness: input.wellness || [],
        completedMembersIds: input.completedMembersIds || [],
        components: input.components.map((c, i) => ({
          id: c.id,
          color: c.color || null,
          from: c.from ? c.from : startOfHour(addHours(new Date(), i)),
          to: c.to ? c.to : endOfHour(addHours(new Date(), i)),
          completedMembersIds: c.completedMembersIds || [],
          supersets: [{ color: null, exercises: [] }],
          subgroups: [],
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
        color: c.color,
        completedMembersIds: c.completedMembersIds,
        subgroups: c.subgroups.map((s) => ({
          id: s.id,
          name: s.name,
          membersIds: s.membersIds,
          supersets: s.supersets.map((s) => ({
            color: s.color,
            exercises: s.exercises.map((e) => ({
              id: e.id,
              color: e.color,
              params: { ...e.params },
              sets: e.sets.map((s) => ({ ...s })),
              periodized: e.periodized,
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
