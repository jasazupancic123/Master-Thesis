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
import {
  FirestoreCollectionRepository,
  GroupRef,
  UserRef,
} from '../../common/type/firebase-firestore.type';
import { Group } from '../entity/group.entity';
import { UserRepository } from '../../user/repository/user.repository';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class GroupRepository
  implements FirestoreCollectionRepository<Group, UserRef>
{
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userRepository: UserRepository,
  ) {}

  async getDocs(
    ref: Required<UserRef>,
    query: (query: Query) => Query = (query) => query,
  ): Promise<Group[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(ref: Required<GroupRef>): Promise<Group | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(ref: Required<UserRef>, input: Partial<Group>) {
    const result = await this.collection(ref).add({
      name: input.name,
      ownerId: input.ownerId,
      membersIds: input.membersIds,
      from: null,
      to: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // add group id to the document for querying by collection group
    await result.update({ id: result.id });
    return result.id;
  }

  async updateDoc(ref: Required<GroupRef>, input: Partial<Group>) {
    await this.doc(ref).update({
      ...(input.name && { name: input.name }),
    });
  }

  doc(ref: Required<GroupRef>): DocumentReference {
    return this.collection(ref).doc(ref.groupId);
  }

  collection(ref: Required<UserRef>): CollectionReference {
    return this.userRepository
      .doc(ref.uid)
      .collection(FirestoreCollection.GROUP);
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
    };
  }
}
