import { BaseEntity } from '../common/entity/base.entity';
import { CollectionReference } from 'firebase-admin/lib/firestore';
import { FirebaseClient, InjectFirebaseAdmin } from './get-firebase-client';
import { BadRequestException } from '@nestjs/common';
import { firestore } from 'firebase-admin';

export interface CanView<T> {
  canView(entity: T, ...args: any[]): boolean | Promise<boolean>;
}

export abstract class FirestoreRepository<T extends BaseEntity> implements CanView<T> {
  private readonly collection: CollectionReference;

  protected constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseClient,
    protected readonly name: string,
  ) {
    this.collection = firebase.firestore.collection(name);
  }

  getCollection(): CollectionReference {
    return this.collection;
  }

  async canView(entity: T) {
    return true;
  }

  async create(data: Partial<T> & Record<string, any>): Promise<T> {
    // TODO - add zod validation or something similar

    // if any field is of type date, convert it to firestore.Timestamp
    for (const key in data) {
      if (data[key] instanceof Date)
        // @ts-ignore
        data[key] = firestore.Timestamp.fromDate(data[key]) as any;
    }

    const doc = await this.collection.add({
      ...data,
      createdAt: firestore.Timestamp.now(),
      updatedAt: firestore.Timestamp.now(),
    });

    const result = await doc.get();
    return this.serialize(result);
  }

  async createMany(data: (Partial<T> & Record<string, any>)[]): Promise<T[]> {
    const batch = this.firebase.firestore.batch();
    const result: T[] = [];

    for (const item of data) {
      const doc = this.collection.doc();
      batch.set(doc, {
        ...item,
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
      });

      result.push({ id: doc.id, ...item } as unknown as T);
    }

    await batch.commit();
    return result;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    await this.collection.doc(id).update(data as any);
    const result = await this.collection.doc(id).get();
    return this.serialize(result);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async findOneById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists)
      return null;

    const item = this.serialize(doc);
    if (!await this.canView(item))
      return null;

    return item;
  }

  async findOneByIdOrFail(id: string): Promise<T> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists)
      throw new BadRequestException(`Document with id ${id} does not exist`);

    const item = this.serialize(doc);
    if (!await this.canView(item))
      throw new BadRequestException(`You are not allowed to view this document`);

    return item;
  }

  async findOneByField(field: keyof T, value: any): Promise<T | null> {
    const snapshot = await this.collection.where(field.toString(), '==', value).limit(1).get();
    if (snapshot.empty)
      return null;

    const item = this.serialize(snapshot.docs[0]);
    if (!await this.canView(item))
      return null;

    return item;
  }

  async findAll(filter?: { ids?: string[] }): Promise<T[]> {
    let query = this.collection as firestore.Query;
    if (filter?.ids)
      query = query.where(firestore.FieldPath.documentId(), 'in', filter.ids);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  map(data: firestore.QuerySnapshot | firestore.DocumentReference): T[] {
    if (data instanceof firestore.DocumentReference) {
      return [{ id: data.id, ...data.get() } as unknown as T];
    }

    return data.docs.map(doc => this.serialize(doc));
  }

  serialize(data: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): T {
    // convert firestore.Timestamp to Date
    const result = data.data();
    for (const key in result) {
      if (result[key] instanceof firestore.Timestamp)
        result[key] = (result[key] as firestore.Timestamp).toDate();
    }

    return { id: data.id, ...result } as unknown as T;
  }
}