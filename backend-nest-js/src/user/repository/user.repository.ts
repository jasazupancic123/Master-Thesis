import { Injectable } from '@nestjs/common';
import { RootFirestoreCollectionRepository } from '../../common/type/firebase-firestore.type';
import { UserEntity } from '../entity/user.entity';
import { CommonService } from '../../common/service/common.service';
import { FirebaseService } from '../../firebase/firebase.service';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { SportLevel } from '../enum/sport-level.enum';

@Injectable()
export class UserRepository
  implements RootFirestoreCollectionRepository<UserEntity>
{
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async getDocs(
    query: (query: Query) => Query = (query) => query,
  ): Promise<UserEntity[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  async getDoc(id: string): Promise<UserEntity | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  /**
   * Returns last bodyweight of the user.
   */
  async getBodyweight(id: string): Promise<number> {
    const { bodyweight } = await this.getDoc(id);
    const sorted = bodyweight.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    
    return sorted.length ? sorted[sorted.length - 1].weight : 0;
  }

  async addDoc(input: Partial<UserEntity>) {
    if (!input.id) throw new Error('User ID is required');

    const bodyweight = input.bodyweight || [];

    await this.doc(input.id).set({
      id: input.id,
      level: input.level || SportLevel.BEGINNER,
      bodyweight: FieldValue.arrayUnion(
        ...bodyweight.map((item) => ({
          weight: item.weight,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })),
      ),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return input.id;
  }

  async updateDoc(
    id: string,
    input: Omit<Partial<UserEntity>, 'bodyweight'> & { weight: number },
  ) {
    const data = this.commonService.object.clean({
      level: input.level,
      ...(input.weight && {
        bodyweight: FieldValue.arrayUnion({
          weight: input.weight,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }),
      }),
    });

    await this.doc(id).update({ ...data, updatedAt: Timestamp.now() });
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(FirestoreCollection.USER);
  }

  /**
   * Newest query tool to query all sub collections with the same name. For user
   * repository, it can be useful to query all `groups` sub collections where
   * some user is a member, or `exercises` sub collections where some user is
   * the author.
   */
  collectionGroup(collectionGroupName: keyof UserEntity): CollectionGroup {
    return this.firebaseService.firestore.collectionGroup(collectionGroupName);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): UserEntity {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      level: data.level,
      bodyweight: (data.bodyweight || []).map((item: any) => ({
        weight: item.weight,
        createdAt: (item.createdAt as Timestamp).toDate(),
        updatedAt: (item.updatedAt as Timestamp).toDate(),
      })),
      groups: data.groups || [],
      wellness: data.wellness || [],
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    };
  }
}
