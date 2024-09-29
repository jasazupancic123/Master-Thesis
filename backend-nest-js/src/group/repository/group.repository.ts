import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { Group } from '../entity/group.entity';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class GroupRepository
  implements RootFirestoreCollectionRepository<Group>
{
  constructor(private readonly firebaseService: FirebaseService) {}

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
    });

    // add group id to the document for querying by collection group
    await result.update({ id: result.id });
    return result.id;
  }

  async updateDoc(id: string, input: Partial<Group>) {
    await this.doc(id).update({
      ...(input.name && { name: input.name }),
    });
  }

  async deleteDoc(id: string) {
    await this.doc(id).update({ deletedAt: Timestamp.now() });
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(FirestoreCollection.GROUP);
  }

  subgroupsCollectionGroup(): CollectionGroup {
    return this.firebaseService.firestore.collectionGroup(
      FirestoreCollection.SUBGROUP,
    );
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Group {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      name: data.name,
      ownerId: data.ownerId,
      owner: null,
      membersIds: data.membersIds,
      availableMembersIds: [],
      members: [],
      subgroups: [],
      cycles: [],
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : null,
    };
  }
}
