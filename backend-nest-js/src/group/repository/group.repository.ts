import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import { CollectionRepository } from '../../firebase/firestore.type';
import { Group } from '../entity/group.entity';

export type GroupRef = {
  groupId?: string;
}

@Injectable()
export class GroupRepository implements CollectionRepository<Group, GroupRef> {
  constructor(private readonly firebaseService: FirebaseService) {
  }

  async getDocs(
    ref: GroupRef,
    query: (query: CollectionReference) => CollectionReference = query => query,
  ): Promise<Group[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Group);
  }

  async getDoc(ref: GroupRef): Promise<Group> {
    const snapshot = await this.doc(ref).get();
    return { id: snapshot.id, ...snapshot.data() } as Group;
  }

  async addDoc(ref: GroupRef, data: Group) {
    await this.doc(ref).set(data);
  }

  async updateDoc(ref: GroupRef, data: Partial<Group>) {
    await this.doc(ref).update(data); // NOTE - updates only provided data fields in the document
  }

  doc(ref: GroupRef): DocumentReference {
    if (!ref.groupId) throw new Error('groupId is required');
    return this.collection().doc(ref.groupId);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore
      .collection(FirestoreCollection.GROUP);
  }
}