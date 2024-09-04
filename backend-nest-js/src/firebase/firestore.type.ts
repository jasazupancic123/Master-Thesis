import { CollectionReference, DocumentReference } from 'firebase-admin/firestore';

export interface CollectionRepository<Model = any, Ref = Record<string, string>> {
  doc(ref: Ref): DocumentReference;

  collection(ref: Ref): CollectionReference;

  getDocs(ref: Ref, query?: (ref: CollectionReference) => CollectionReference): Promise<Model[]>;

  getDoc(ref: Ref): Promise<Model>;

  addDoc(ref: Ref, data: Model | Partial<Model> & Record<string, any>): Promise<void>;

  updateDoc(ref: Ref, data: Partial<Model> & Record<string, any>): Promise<void>;
}