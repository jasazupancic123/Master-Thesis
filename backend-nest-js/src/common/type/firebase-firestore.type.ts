import { CollectionReference, DocumentReference, Query } from 'firebase-admin/firestore';

export interface FirestoreCollectionRepository<Model = any, Ref = Record<string, string>> {
  doc(ref: Ref): DocumentReference;

  collection(ref: Ref): CollectionReference;

  getDocs(ref: Ref, query?: (ref: Query) => Query): Promise<Model[]>;

  getDoc(ref: Ref): Promise<Model | null>;

  addDoc(ref: Ref, data: Model | Partial<Model> & Record<string, any>): Promise<string>;

  updateDoc(ref: Ref, data: Partial<Model> & Record<string, any>): Promise<void>;
}

export interface RootFirestoreCollectionRepository<Model = any> {
  doc(id: string): DocumentReference;

  collection(): CollectionReference;

  getDocs(query?: (ref: Query) => Query): Promise<Model[]>;

  getDoc(id: string): Promise<Model | null>;

  addDoc(data: Model | Partial<Model> & Record<string, any>): Promise<string>;

  updateDoc(id: string, data: Partial<Model> & Record<string, any>): Promise<void>;
}

export type RootRef = { userId?: string; } // for root collections
export type GroupRef = { groupId?: string; subgroupId?: string; }
export type SubgroupRef = GroupRef
export type CycleRef = GroupRef & { cycleId?: string }
export type TrainingRef = CycleRef & { trainingId?: string }
export type TrainingComponentRef = TrainingRef & { componentId?: string }
export type TrainingExerciseRef = TrainingComponentRef & { exerciseId?: string }
export type TrainingExerciseUserDataRef = TrainingExerciseRef & { userId?: string }