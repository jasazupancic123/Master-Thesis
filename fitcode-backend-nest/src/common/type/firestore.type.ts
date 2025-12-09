import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';

import type { FirebaseService } from '@src/firebase/firebase.service';

import type { FirestoreEntity } from './entity.type';

export abstract class FirestoreRepository<Model extends object, Ref = string> {
  abstract collectionName: string;

  readonly firebase: FirebaseService;

  constructor(firebaseService: FirebaseService) {
    this.firebase = firebaseService;
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Model {
    const serialized = this.firebase.serialize(
      snapshot.data() as FirestoreEntity<Model>,
    );

    if ('id' in serialized) serialized.id = snapshot.id;
    return serialized;
  }

  abstract collection(
    ...ref: Ref extends string ? [] : [ref: Ref]
  ): CollectionReference;

  abstract doc(ref: Ref): DocumentReference;

  async findById(ref: Ref): Promise<Model | null> {
    const snapshot = await this.doc(ref).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async findAll(
    query: (ref: Query) => Query = (ref) => ref,
    ...ref: Ref extends string ? [] : [ref: Ref]
  ): Promise<Model[]> {
    const snapshot = await query(this.collection(...ref)).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  abstract save<T extends Model & Record<string, unknown>>(
    input: T,
    ...ref: Ref extends string ? [] : [ref: Ref]
  ): Promise<string>;

  abstract update(ref: Ref, input: Partial<Model>): Promise<void>;

  abstract delete(ref: Ref): Promise<void>;
}

export type ComponentRef = { componentId: string };
export type InstitutionRef = { institutionId: string };
export type GroupRef = InstitutionRef & { groupId: string };
export type CycleRef = GroupRef & { cycleId: string };
export type InstitutionMemberRef = InstitutionRef & UserRef;
export type TrainingProtocolRef = InstitutionRef & { protocolId: string };
export type MethodRef = { methodId: string };
export type ExerciseRef = { exerciseId: string };
export type UserExerciseStatsRef = UserRef & ExerciseRef;

export type UserRef = { uid: string }; // auth user uid
export type ProfileRef = UserRef;
export type WellnessRef = UserRef & { date: Date };

export type TrainingRef = { trainingId: string };
export type SubgroupRef = TrainingRef & { subgroupId?: string };
export type TrainingComponentRef = TrainingRef & ComponentRef;
export type TrainingSupersetRef = TrainingComponentRef & {
  supersetIndex: number;
};
export type TrainingExerciseRef = Omit<
  TrainingSupersetRef & ExerciseRef,
  'superset'
>;
export type WorkloadRef = TrainingExerciseRef & {
  userId: string;
  supersetIndex: number;
  setNumber: number;
};
export type TrainingComponentUserStatusRef = TrainingComponentRef & UserRef;
