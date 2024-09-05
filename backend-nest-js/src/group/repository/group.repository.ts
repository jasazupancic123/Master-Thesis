import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { Group } from '../entity/group.entity';
import { CommonService } from '../../common/service/common.service';

@Injectable()
export class GroupRepository implements RootFirestoreCollectionRepository<Group> {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {
  }

  async getDocs(
    query: (query: Query) => Query = query => query,
  ): Promise<Group[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map(doc => this.serialize(doc));
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
    });

    return result.id;
  }

  async updateDoc(id: string, input: Partial<Group>) {
    const data = this.commonService.object.clean(input);
    await this.doc(id).update(data);
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(FirestoreCollection.GROUP);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Group {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      name: data.name,
      ownerId: data.ownerId,
      membersIds: data.membersIds,
      subgroups: [],
      cycles: [],
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as Group;
  }
}