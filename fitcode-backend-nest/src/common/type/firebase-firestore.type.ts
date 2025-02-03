import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { UserEntity } from '../../user/entity/user.entity';
import { Component } from '../../component/entity/component.entity';
import { ExerciseAttribute } from '../../exercise/entity/exercise-attribute.entity';
import { FirestoreCollection } from '../enum/firestore-collection.enum';
import { Exercise } from '../../exercise/entity/exercise.entity';

export interface FirestoreCollectionRepository<
  Model = any,
  Ref = Record<string, string>,
> {
  doc(ref: Ref): DocumentReference;

  collection(ref: Ref): CollectionReference;

  getDocs(ref: Ref, query?: (ref: Query) => Query): Promise<Model[]>;

  getDoc(ref: Ref): Promise<Model | null>;

  addDoc(
    ref: Ref,
    input: Model | (Partial<Model> & Record<string, any>),
  ): Promise<string>;

  updateDoc(
    ref: Ref,
    input: Partial<Model> & Record<string, any>,
  ): Promise<void>;

  deleteDoc(ref: Ref): Promise<void>;

  serialize(data: DocumentSnapshot | QueryDocumentSnapshot): Model;
}

export interface RootFirestoreCollectionRepository<Model = any> {
  doc(id: string): DocumentReference;

  collection(): CollectionReference;

  getDocs(query?: (ref: Query) => Query): Promise<Model[]>;

  getDoc(id: string): Promise<Model | null>;

  addDoc(
    input: Model | (Partial<Model> & Record<string, any>),
  ): Promise<string>;

  updateDoc(
    id: string,
    input: Partial<Model> & Record<string, any>,
  ): Promise<void>;

  deleteDoc(id: string): Promise<void>;

  serialize(data: DocumentSnapshot | QueryDocumentSnapshot): Model;
}

export type ComponentRef = { componentId?: string };

export type ExerciseRef = { exerciseId?: string };
export type ExerciseAttributeRef = { attributeId?: string };
export type ExerciseAttributeValueRef = ExerciseRef & ExerciseAttributeRef;

export type UserRef = { uid?: string }; // auth user uid
export type UserMetaRef = UserRef & { date: Date };

export type GroupRef = { groupId?: string };
export type SubgroupRef = GroupRef & { subgroupId?: string };
export type CycleRef = GroupRef & { cycleId?: string };

export type TrainingRef = { trainingId?: string };
export type TrainingComponentRef = TrainingRef & ComponentRef;
export type TrainingSupersetRef = TrainingComponentRef & {
  superset?: number;
};
export type TrainingExerciseRef = TrainingSupersetRef & ExerciseRef;
export type TrainingWorkloadRef = TrainingExerciseRef & {
  userId?: string;
};

// root collections
export type DatabaseSchema = {
  [FirestoreCollection.USER]: UserEntity[];
  [FirestoreCollection.COMPONENT]: Component[];
  [FirestoreCollection.EXERCISE_ATTRIBUTE]: ExerciseAttribute[];
  [FirestoreCollection.EXERCISE]: Exercise[];
};
