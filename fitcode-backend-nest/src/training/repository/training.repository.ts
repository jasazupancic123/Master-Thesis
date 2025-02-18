import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { CommonService } from 'src/common/service/common.service';
import { Component } from 'src/component/entity/component.entity';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';

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
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(id: string): Promise<Training | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(
    input: Partial<
      Omit<Training, 'components'> & {
        components: Partial<TrainingComponent>[];
      }
    >,
  ): Promise<string> {
    if (input.membersIds?.length === 0)
      throw new BadRequestException('Training must have atleast one member');

    if (input.components?.length === 0)
      throw new BadRequestException('Training must have atleast one component');

    const result = await this.collection().add({
      groupId: input.groupId,
      cycleId: input.cycleId,
      ownerId: input.ownerId,
      from: Timestamp.fromDate(input.from),
      to: Timestamp.fromDate(input.to),
      membersIds: input.membersIds || [],
      copiedFromId: input.copiedFromId || null,
      components: input.components.map((c) => ({
        id: c.id,
        color: c.color || this.commonService.color.random(),
        from: Timestamp.fromDate(c.from ? c.from : new Date()),
        to: Timestamp.fromDate(c.to ? c.to : new Date()),
        subgroups: c.subgroups || [],
        supersets: c.supersets || [
          {
            color: this.commonService.color.random(),
            exercises: [],
          },
        ],
      })),
      meta: input.meta || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: null,
    });

    return result.id;
  }

  async updateDoc(id: string, input: Partial<Training>) {
    await this.doc(id).update({
      ...(input.from && { from: Timestamp.fromDate(input.from) }),
      ...(input.to && { to: Timestamp.fromDate(input.to) }),
      ...(input.components && {
        components: input.components.map((c) => ({
          id: c.id,
          from: Timestamp.fromDate(c.from || new Date()),
          to: Timestamp.fromDate(c.to || new Date()),
          color: c.color || null,
          subgroups: c.subgroups.map((s) => ({
            id: s.id,
            name: s.name,
            membersIds: s.membersIds,
            supersets: s.supersets.map((s) => ({
              color: s.color,
              exercises: s.exercises.map((e) => ({
                id: e.id,
                color: e.color,
                meta: { ...e.meta },
              })),
            })),
          })),
          supersets: c.supersets.map((s) => ({
            color: s.color,
            exercises: s.exercises.map((e) => ({
              id: e.id,
              color: e.color,
              meta: { ...e.meta },
            })),
          })),
        })),
        updatedAt: Timestamp.now(),
      }),
    });
  }

  async deleteDoc(id: string) {
    // await this.doc(id).update({ deletedAt: Timestamp.now() });
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

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Training {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      groupId: data.groupId,
      cycleId: data.cycleId,
      ownerId: data.ownerId,
      membersIds: data.membersIds,
      copiedFromId: data.copiedFromId || null,
      from: (data.from as Timestamp).toDate(),
      to: (data.to as Timestamp).toDate(),
      components: (data.components || []).map((c: any) => ({
        id: c.id,
        color: c.color || null,
        from: (c.from as Timestamp).toDate(),
        to: (c.to as Timestamp).toDate(),
        supersets: c.supersets || [],
        subgroups: c.subgroups || [],
      })),
      meta: data.meta || [],
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : null,
    };
  }
}
