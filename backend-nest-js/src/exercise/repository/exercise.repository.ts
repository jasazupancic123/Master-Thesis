import { Injectable } from '@nestjs/common';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CollectionGroup,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { ExerciseRef, FirestoreCollectionRepository, UserRef } from '../../common/type/firebase-firestore.type';
import { Exercise } from '../entity/exercise.entity';
import { CommonService } from '../../common/service/common.service';
import { UserRepository } from '../../user/repository/user.repository';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class ExerciseRepository implements FirestoreCollectionRepository<Exercise, UserRef> {
  constructor(
    private readonly commonService: CommonService,
    private readonly userRepository: UserRepository,
    private readonly firebaseService: FirebaseService,
  ) {
  }

  async getDocs(
    ref: Required<UserRef>,
    query: (query: Query) => Query = query => query,
  ): Promise<Exercise[]> {
    const snapshot = await query(this.collection(ref)).get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  async getDoc(ref: Required<ExerciseRef>): Promise<Exercise> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async addDoc(ref: Required<UserRef>, input: Partial<Exercise>) {
    const result = await this.collection(ref).add({
      userId: ref.uid,
      name: input.name,
      componentIds: input.componentsIds,
      global: input.global ?? false,
      imageUrl: input.imageUrl ?? null,
      videoUrl: input.videoUrl ?? null,
    });

    return result.id;
  }

  async updateDoc(ref: Required<ExerciseRef>, input: Partial<Exercise>) {
    const data = this.commonService.object.clean(input);
    await this.doc(ref).update(data);
  }

  doc(ref: Required<ExerciseRef>): DocumentReference {
    return this.collection(ref).doc(ref.exerciseId);
  }

  collection(ref: Required<UserRef>): CollectionReference {
    return this.userRepository.doc(ref.uid).collection(FirestoreCollection.EXERCISE);
  }

  collectionGroup(collectionGroupName: keyof Exercise): CollectionGroup {
    return this.firebaseService.firestore.collectionGroup(collectionGroupName);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Exercise {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      userId: data.userId,
      name: data.name,
      componentsIds: data.componentIds,
      global: data.global ?? false,
      imageUrl: data.imageUrl ?? null,
      videoUrl: data.videoUrl ?? null,
    } as Exercise;
  }
}