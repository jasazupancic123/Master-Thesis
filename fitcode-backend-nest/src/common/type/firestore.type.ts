import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Query,
} from 'firebase-admin/firestore';

import type { FirestoreEntity } from './entity.type';

export interface BatchWriteOperation<T> {
  ref: DocumentReference<DocumentData, DocumentData>;
  data: FirestoreEntity<T> | FirestoreEntity<Partial<T>>;
  operation: 'set' | 'update';
  options?: { merge?: boolean }; // Only applicable for 'set' operations
}

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

  getDocs(query?: (ref: Query) => Query): Promise<Model[]>;

  getDoc(id: string): Promise<Model | null>;

  addDoc(
    input: Model | (Partial<Model> & Record<string, unknown>),
  ): Promise<string>;

  updateDoc(
    id: string,
    input: Partial<Model> & Record<string, unknown>,
  ): Promise<void>;

  deleteDoc(id: string): Promise<void>;
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
export type TrainingSupersetRef = TrainingComponentRef & { superset: number };
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
