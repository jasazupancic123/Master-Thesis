import { FieldValue } from '@google-cloud/firestore';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { CommonService } from 'src/common/service/common.service';
import { v4 } from 'uuid';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Cycle } from '../entity/cycle.entity';
import { Group, GroupFirestore } from '../entity/group.entity';

@Injectable()
export class GroupRepository
  implements RootFirestoreCollectionRepository<Group>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<Group[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(id: string): Promise<Group | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(input: Partial<Group>) {
    const result = await this.collection().add({
      name: input.name,
      ownerId: input.ownerId,
      membersIds: input.membersIds,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: null,
      cycles: input.cycles ?? [],
    });

    return result.id;
  }

  async addCycle(id: string, input: Partial<Cycle>) {
    const cycleId = v4();

    await this.doc(id).update({
      cycles: FieldValue.arrayUnion({
        id: cycleId,
        name: input.name,
        description: input.description || null,
        from: Timestamp.fromDate(input.from),
        to: Timestamp.fromDate(input.to),
        rootComponentsIds: input.rootComponentsIds || [],
        leafComponentsIds: input.leafComponentsIds || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        deletedAt: null,
      }),
    });

    return cycleId;
  }

  async updateDoc(id: string, input: Partial<Group>) {
    await this.doc(id).update(this.commonService.object.clean(input));
  }

  async updateCycle(id: string, cycleId: string, input: Partial<Cycle>) {
    // https://www.reddit.com/r/Firebase/comments/15xeiac/how_to_update_an_item_in_an_array_with_firebase/ :/
    const ref = this.doc(id);

    try {
      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          const doc = await transaction.get(ref);
          if (!doc.exists)
            throw new BadRequestException('Group does not exist');

          const group = doc.data() as GroupFirestore;
          const cycle = group.cycles.find((cycle) => cycle.id === cycleId);
          if (!cycle) throw new BadRequestException('Cycle does not exist');

          const updatedCycle = {
            ...cycle,
            ...(input.name && { name: input.name }),
            ...(input.description && { description: input.description }),
            ...(input.from && { from: Timestamp.fromDate(input.from) }),
            ...(input.to && { to: Timestamp.fromDate(input.to) }),
            ...(input.rootComponentsIds && {
              rootComponentsIds: input.rootComponentsIds,
            }),
            ...(input.leafComponentsIds && {
              leafComponentsIds: input.leafComponentsIds,
            }),
            updatedAt: Timestamp.now(),
          };

          const updatedCycles = group.cycles
            .filter((c) => c.id !== cycle.id)
            .concat(updatedCycle)
            .sort((a, b) => a.from.toMillis() - b.from.toMillis());

          transaction.update(ref, { ...group, cycles: updatedCycles });
        },
      );
    } catch (e) {
      console.error('updateCycle transaction failed:', e);
    }
  }

  async deleteDoc(id: string) {
    const ref = this.doc(id);

    try {
      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          const doc = await transaction.get(ref);
          if (!doc.exists)
            throw new BadRequestException('Document does not exist');

          // delete all cycles
          /*
          const group = doc.data() as Group; 
          const updatedCycles = group.cycles.map((cycle) => ({
            ...cycle,
            deletedAt: Timestamp.now(),
          })); */

          // delete group
          const updatedCycles = [];
          transaction.update(ref, {
            deletedAt: Timestamp.now(),
            cycles: updatedCycles,
          });
        },
      );
    } catch (e) {
      console.error('deleteDoc transaction failed:', e);
    }
  }

  async deleteCycle(id: string, cycleId: string) {
    const ref = this.doc(id);

    try {
      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          const doc = await transaction.get(ref);
          if (!doc.exists)
            throw new BadRequestException('Group does not exist');

          const group = doc.data() as GroupFirestore;
          const cycle = group.cycles.find((cycle) => cycle.id === cycleId);
          if (!cycle) throw new BadRequestException('Cycle does not exist');

          transaction.update(ref, {
            ...group,
            updatedAt: Timestamp.now(),
            cycles: group.cycles
              .filter((c) => c.id !== cycle.id)
              .sort((a, b) => a.from.toMillis() - b.from.toMillis()),
            // cycles: [...group.cycles, { ...cycle, deletedAt: Timestamp.now() }],
          });
        },
      );
    } catch (e) {
      console.error('deleteCycle transaction failed:', e);
    }
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(FirestoreCollection.GROUP);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Group {
    const data = snapshot.data() as GroupFirestore;

    return {
      id: snapshot.id,
      name: data.name,
      ownerId: data.ownerId,
      membersIds: data.membersIds,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      deletedAt: data.deletedAt ? data.deletedAt.toDate() : null,
      cycles: data.cycles
        .map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || null,
          from: c.from.toDate(),
          to: c.to.toDate(),
          rootComponentsIds: c.rootComponentsIds || [],
          leafComponentsIds: c.leafComponentsIds || [],
          createdAt: c.createdAt.toDate(),
          updatedAt: c.updatedAt.toDate(),
          weeks: this.commonService.date.weeks(c.from.toDate(), c.to.toDate()),
        }))
        .sort((a, b) => a.from.getMilliseconds() - b.from.getMilliseconds()),
    };
  }
}
