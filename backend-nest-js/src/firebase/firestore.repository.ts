import { BaseEntity } from '../common/entity/base.entity';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  Query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  WhereFilterOp,
} from 'firebase-admin/firestore';
import { FirebaseClient, InjectFirebaseAdmin } from './get-firebase-client';
import { BadRequestException } from '@nestjs/common';
import { Options } from '../common/type/orm.type';
import { PaginateOptions } from '../common/type/paginate.type';

export abstract class FirestoreRepository<T extends BaseEntity> {
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

  async create(data: Partial<T> & Record<string, any>): Promise<T> {
    // TODO - add zod validation or something similar

    // if any field is of type date, convert it to firestore.Timestamp
    for (const key in data) {
      if (data[key] instanceof Date)
        // @ts-ignore
        data[key] = Timestamp.fromDate(data[key]) as any;
    }

    const doc = await this.collection.add({
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      result.push({ id: doc.id, ...item } as unknown as T);
    }

    await batch.commit();
    return result;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // if any field is of type date, convert it to firestore.Timestamp
    for (const key in data)
      if (data[key] instanceof Date)
        // @ts-ignore
        data[key] = Timestamp.fromDate(data[key]) as any;

    await this.collection.doc(id).update(data as any);
    const result = await this.collection.doc(id).get();
    return this.serialize(result);
  }

  async updateMany(input: { id: string, data: Partial<T> }[]): Promise<T[]> {
    const batch = this.firebase.firestore.batch();
    const result: T[] = [];

    for (const item of input) {
      batch.update(this.collection.doc(item.id), item.data as any);
      result.push({ id: item.id, ...item.data } as unknown as T);
    }

    await batch.commit();
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async deleteMany(ids: string[]): Promise<void> {
    const batch = this.firebase.firestore.batch();
    for (const id of ids)
      batch.delete(this.collection.doc(id));

    await batch.commit();
  }

  async findOneById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists)
      return null;

    return this.serialize(doc);
  }

  async findOneByIdOrFail(id: string): Promise<T> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists)
      throw new BadRequestException(`Document with id ${id} does not exist`);

    return this.serialize(doc);
  }

  async findOneBy(field: keyof T, value: any): Promise<T | null> {
    const snapshot = await this.collection.where(field.toString(), '==', value).limit(1).get();
    if (snapshot.empty) return null;
    return this.serialize(snapshot.docs[0]);
  }

  async findAll(options?: Options<T>): Promise<T[]> {
    let query = this.collection as Query;

    if (options?.filter)
      if (options.filter.ids)
        query = query.where(FieldPath.documentId(), 'in', options.filter.ids);

    if (options?.paginate)
      query = this.paginate(query, options.paginate);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  async findAllBy(field: keyof T, value: any, paginate?: PaginateOptions<T>): Promise<T[]> {
    let query = await this.collection.where(field.toString(), '==', value);
    if (paginate)
      query = this.paginate(query, paginate);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  async findAllByMany(
    conditions: { field: keyof T, operator: WhereFilterOp, value: any }[],
    options?: Options<T>,
  ): Promise<T[]> {
    let query = this.collection as Query;

    for (const condition of conditions)
      if (condition.value !== undefined)
        query = query.where(condition.field.toString(), condition.operator, condition.value);

    if (options?.paginate)
      query = this.paginate(query, options.paginate);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.serialize(doc));
  }

  map(data: QuerySnapshot | DocumentReference): T[] {
    if (data instanceof DocumentReference) {
      return [{ id: data.id, ...data.get() } as unknown as T];
    }

    return data.docs.map(doc => this.serialize(doc));
  }

  serialize(data: QueryDocumentSnapshot | DocumentSnapshot): T {
    // convert firestore.Timestamp to Date
    const result = data.data();
    for (const key in result) {
      if (result[key] instanceof Timestamp)
        result[key] = (result[key] as Timestamp).toDate();
    }

    return { id: data.id, ...result } as unknown as T;
  }

  paginate(query: Query, options: PaginateOptions<T>): Query {
    const { order, page, pageSize, limit } = options;

    if (order)
      for (const key in order)
        query = query.orderBy(key, order[key]);

    if (page && pageSize)
      query = query.limit(pageSize).offset(pageSize * page);

    if (limit)
      query = query.limit(limit);

    return query;
  }
}