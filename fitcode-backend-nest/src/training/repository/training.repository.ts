import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import {
  RootFirestoreCollectionRepository,
  TrainingExerciseRef,
  TrainingSupersetRef,
} from '../../common/type/firebase-firestore.type';
import { Training } from '../entity/training.entity';
import { FirebaseService } from '../../firebase/firebase.service';
import { TrainingExercise } from '../entity/training-exercise.entity';

@Injectable()
export class TrainingRepository
  implements RootFirestoreCollectionRepository<Training>
{
  constructor(private readonly firebaseService: FirebaseService) {}

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

  async addDoc(input: Partial<Training>): Promise<string> {
    const result = await this.collection().add({
      groupId: input.groupId,
      cycleId: input.cycleId,
      ownerId: input.ownerId,
      membersIds: input.membersIds || [],
      copiedFromId: input.copiedFromId || null,
      from: Timestamp.fromDate(input.from),
      to: Timestamp.fromDate(input.to),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: null,
      components: input.components || {},
      meta: input.meta || {},
      subgroups: input.subgroups || [],
    });

    return result.id;
  }

  async updateDoc(id: string, input: Partial<Training>) {
    await this.doc(id).update({
      ...input,
      ...(input.from && { from: Timestamp.fromDate(input.from) }),
      ...(input.to && { to: Timestamp.fromDate(input.to) }),
      updatedAt: Timestamp.now(),
    });
  }

  async deleteDoc(id: string) {
    await this.doc(id).update({ deletedAt: Timestamp.now() });
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
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : null,
      components: data.components || {},
      meta: data.meta || {},
      subgroups: data.subgroups || {},
    };
  }
}
