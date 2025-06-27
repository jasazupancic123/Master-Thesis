import { Injectable } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { CommonService } from '../../common/service/common.service';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { RootFirestoreCollectionRepository } from '../../common/type/firestore.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Group } from '../entity/group.entity';

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

  async addDoc(input: Create<Group>) {
    const query = this.firebaseService.buildCreateQuery<Group>(
      {
        id: null,
        name: input.name,
        ownerId: input.ownerId,
        membersIds: input.membersIds,
        institutionId: input.institutionId,
        cycles: [],
      },
      { timestamps: true },
    );

    const result = await this.collection().add(query);
    return result.id;
  }

  async updateDoc(id: string, input: Update<Group>) {
    const query = this.firebaseService.buildUpdateQuery(input);
    await this.doc(id).update(query);
  }

  async deleteDoc(id: string) {
    await this.doc(id).delete();
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(FirestoreCollection.GROUP);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Group {
    const serialized = this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Group>,
    );

    serialized.cycles = serialized.cycles
      .map((c) => ({
        ...c,
        weeks: this.commonService.date.weeks(c.from, c.to),
      }))
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

    serialized.id = snapshot.id;
    return serialized;
  }
}
