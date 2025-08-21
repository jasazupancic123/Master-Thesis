import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';

import type { FirebaseService } from '@src/firebase/firebase.service';

import type { FirestoreEntity } from './entity.type';

interface BatchOperationBase {
  operation: string;
  ref: DocumentReference<DocumentData, DocumentData>;
}

export interface BatchSetOperation<T> extends BatchOperationBase {
  operation: 'set';
  data: FirestoreEntity<T>;
  options?: { merge?: boolean };
}

export interface BatchUpdateOperation<T> extends BatchOperationBase {
  operation: 'update';
  data: FirestoreEntity<Partial<T>>;
}

export interface BatchDeleteOperation extends BatchOperationBase {
  operation: 'delete';
}

export type BatchOperation<T> =
  | BatchSetOperation<T>
  | BatchUpdateOperation<T>
  | BatchDeleteOperation;

export type BatchWriteOperation<T> =
  | BatchSetOperation<T>
  | BatchUpdateOperation<T>;

export interface FirestoreCollectionRepository<
  Model = unknown,
  Ref = Record<string, string>,
> {
  doc(ref: Ref): DocumentReference;

  collection(ref: Ref): CollectionReference;

  getDocs(ref: Ref, query?: (ref: Query) => Query): Promise<Model[]>;

  getDoc(ref: Ref): Promise<Model | null>;

  addDoc(
    ref: Ref,
    input: Model | (Partial<Model> & Record<string, unknown>),
  ): Promise<string>;

  updateDoc(
    ref: Ref,

    input: Partial<Model> & Record<string, any>,
  ): Promise<void>;

  deleteDoc(ref: Ref): Promise<void>;
}

export interface RootFirestoreCollectionRepository<Model = unknown> {
  doc(id: string): DocumentReference;

  collection(): CollectionReference;

  findAll(query?: (ref: Query) => Query): Promise<Model[]>;

  findById(id: string): Promise<Model | null>;

  save(
    input: Model | (Partial<Model> & Record<string, unknown>),
  ): Promise<string>;

  update(
    id: string,
    input: Partial<Model> & Record<string, unknown>,
  ): Promise<void>;

  delete(id: string): Promise<void>;
}

export abstract class FirestoreRepository<
  Model extends object,
  Ref = Record<string, string>,
> implements FirestoreCollectionRepository<Model, Ref>
{
  protected readonly firebaseService: FirebaseService;
  protected readonly parentRepository:
    | FirestoreCollectionRepository<Model, Ref>
    | FirestoreRootRepository<Model> = null;

  constructor(
    firebaseService: FirebaseService,
    parentRepository:
      | FirestoreCollectionRepository<Model, Ref>
      | FirestoreRootRepository<Model> = null,
  ) {
    this.firebaseService = firebaseService;
    this.parentRepository = parentRepository;
  }

  abstract collectionName: string;

  abstract doc(ref: Ref): DocumentReference;

  abstract collection(ref: Ref): CollectionReference;

  abstract getDoc(ref: Ref): Promise<Model | null>;

  abstract getDocs(ref: Ref, query?: (ref: Query) => Query): Promise<Model[]>;

  abstract addDoc(
    ref: Ref,
    input: Model | (Partial<Model> & Record<string, unknown>),
  ): Promise<string>;

  abstract updateDoc(
    ref: Ref,
    input: Partial<Model> & Record<string, any>,
  ): Promise<void>;

  abstract deleteDoc(ref: Ref): Promise<void>;
}

export abstract class FirestoreRootRepository<Model extends object>
  implements RootFirestoreCollectionRepository<Model>
{
  abstract collectionName: string;

  readonly firebaseService: FirebaseService;

  constructor(firebaseService: FirebaseService) {
    this.firebaseService = firebaseService;
  }

  collection(): CollectionReference {
    return this.firebaseService.firestore.collection(this.collectionName);
  }

  serialize(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Model {
    const serialized = this.firebaseService.serialize(
      snapshot.data() as FirestoreEntity<Model>,
    );

    if ('id' in serialized) serialized.id = snapshot.id;
    return serialized;
  }

  doc(id: string): DocumentReference {
    return this.collection().doc(id);
  }

  async findById(id: string): Promise<Model | null> {
    const snapshot = await this.doc(id).get();
    if (!snapshot.exists) return null;
    return this.serialize(snapshot);
  }

  async findAll(
    query: (ref: Query) => Query = (query) => query,
  ): Promise<Model[]> {
    const snapshot = await query(this.collection()).get();
    return snapshot.docs.map((doc) => this.serialize(doc));
  }

  abstract save(
    input: Model | (Partial<Model> & Record<string, unknown>),
  ): Promise<string>;

  abstract update(
    id: string,
    input: Partial<Model> & Record<string, unknown>,
  ): Promise<void>;

  abstract delete(id: string): Promise<void>;
}

export type ComponentRef = { componentId: string };
export type InstitutionRef = { institutionId: string };
export type TargetRef = { targetId: string };
export type MethodRef = { methodId: string };
export type ExerciseRef = { exerciseId: string };
export type ExerciseAttributeValueRef = ExerciseRef & {
  exerciseAttributeValueId: string;
};

export type UserRef = { uid: string }; // auth user uid
export type WellnessRef = UserRef & { date: Date };
export type GroupRef = { groupId: string };
export type CycleRef = GroupRef & { cycleId: string };
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
export type TrainingStatusRef = TrainingComponentRef & { userId: string };
