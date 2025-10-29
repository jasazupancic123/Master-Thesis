import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { Auth, UserIdentifier } from 'firebase-admin/auth';
import {
  DocumentReference,
  GeoPoint,
  PartialWithFieldValue,
  Query,
  Timestamp,
} from 'firebase-admin/firestore';
import { Storage } from 'firebase-admin/storage';

import { BatchOperation } from '@src/common/type/orm.type';

import { UserRole } from '../auth/enum/user-role.enum';
import { TimestampEntity } from '../common/entity/timestamp.entity';
import { CommonService } from '../common/service/common.service';
import { Create, FirestoreEntity, Update } from '../common/type/entity.type';
import { DecodedUser, User } from '../common/type/firebase-auth.type';
import { Environment } from '../config/environment-validation-schema';
import { FirebaseClient, InjectFirebaseAdmin } from './get-firebase-client';

@Injectable()
export class FirebaseService implements OnApplicationBootstrap {
  public readonly app: App;
  public readonly auth: Auth;
  public readonly firestore: admin.firestore.Firestore;
  public readonly storage: Storage;
  private logger = new Logger(this.constructor.name);

  constructor(
    private readonly configService: ConfigService<Environment>,
    private readonly commonService: CommonService,
    @InjectFirebaseAdmin() private readonly firebaseAdmin: FirebaseClient,
  ) {
    this.app = this.firebaseAdmin.app;
    this.auth = this.firebaseAdmin.auth;
    this.firestore = this.firebaseAdmin.firestore;
    this.storage = this.firebaseAdmin.storage;
  }

  /**
   * Build create query for Firebase Firestore database.
   */
  buildCreateQuery<T>(
    obj: Create<T>,
    options?: { timestamps?: boolean },
  ): FirestoreEntity<T> {
    const timestamps: TimestampEntity = {
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const cleaned = this.commonService.object.clean({
      ...obj,
      ...(options?.timestamps ? timestamps : {}),
    });

    return this.convertDatesToTimestamps(cleaned) as FirestoreEntity<T>;
  }

  /**
   * Build create query for Firebase Firestore database.
   */
  buildUpdateQuery<T>(obj: Update<T>): FirestoreEntity<Partial<T>> {
    const cleaned = this.commonService.object.clean(obj, true);

    return this.convertDatesToTimestamps({
      ...cleaned,
      updatedAt: new Date(),
    }) as FirestoreEntity<Partial<T>>;
  }

  async batchIn<T>(
    field: keyof T,
    array: string[],
    collection:
      | FirebaseFirestore.CollectionReference
      | FirebaseFirestore.CollectionGroup,
    query: (query: Query) => Query = (query) => query,
    options?: {
      batchSize?: number;
    },
  ): Promise<T[]> {
    if (!array || !array.length || !collection) return [];

    const { batchSize = 30 } = options || {}; // firestore limits batches to 30
    const copy = [...array];

    const batches = [];
    while (copy.length) {
      const batch = copy.splice(0, batchSize);

      batches.push(
        query(collection.where(field as string, 'in', batch))
          .get()
          .then(({ docs }) =>
            docs.map((doc) =>
              this.serialize<T>(doc.data() as FirestoreEntity<T>),
            ),
          ),
      );
    }

    // after all of the data is fetched, return it
    return Promise.all(batches).then((content) => content.flat());
  }

  /**
   * Executes batched write operations in Firestore
   * @param operations Array of write operations to execute
   * @param options Configuration options
   */
  async paginateBatches<T>(
    operations: BatchOperation<T>[],
    options?: {
      batchSize?: number;
      maxRetries?: number;
      retryDelayMs?: number; // ms
    },
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!operations?.length) return { successCount: 0, failureCount: 0 };

    const {
      batchSize = 500,
      maxRetries = 3,
      retryDelayMs = 1000,
    } = options || {};

    const db = this.firestore;
    const chunks = this.chunkArray(operations, batchSize);
    let successCount = 0;
    let failureCount = 0;

    for (const [chunkIndex, chunk] of chunks.entries()) {
      let retryAttempt = 0;
      let chunkSuccess = false;

      while (retryAttempt <= maxRetries && !chunkSuccess) {
        try {
          const batch = db.batch();

          chunk.forEach((chunk) => {
            const { ref, operation } = chunk;

            switch (operation) {
              case 'set':
                batch.set(
                  ref,
                  chunk.data as PartialWithFieldValue<T>,
                  chunk.options || {},
                );
                break;
              case 'update':
                batch.update(ref, chunk.data as unknown);
                break;
              case 'delete':
                batch.delete(ref);
                break;
              default:
                throw new Error(`Unsupported batch operation: ${operation}`);
            }
          });

          await batch.commit();

          successCount += chunk.length;
          chunkSuccess = true;
        } catch (e: unknown) {
          retryAttempt++;
          if (retryAttempt > maxRetries) {
            failureCount += chunk.length;
            console.error(
              `Failed batch ${chunkIndex} after ${maxRetries} attempts`,
              e,
            );
          } else
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    return { successCount, failureCount };
  }

  /**
   * Serializes a Firestore object into a plain JavaScript object.
   * Handles Firestore-specific data types like Timestamp, GeoPoint, and DocumentReference.
   */
  serialize<T>(obj: FirestoreEntity<T>): T {
    if (obj === null || typeof obj !== 'object') return obj as T;
    if (Array.isArray(obj)) return obj.map((item) => this.serialize(item)) as T;

    if (obj instanceof Timestamp) return obj.toDate() as T;
    if (obj instanceof DocumentReference) return obj.path as T;
    if (obj instanceof GeoPoint)
      return { latitude: obj.latitude, longitude: obj.longitude } as T;

    const result: Record<string, unknown> = {};
    for (const key in obj)
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        result[key] = this.serialize(value);
      }

    return result as T;
  }

  async findUserById(uid: string) {
    return (await this.auth.getUser(uid)) as User;
  }

  async authUsers(filter?: {
    ids?: string[];
    emails?: string[];
  }): Promise<User[]> {
    const identifiers: UserIdentifier[] = [];
    if (filter?.ids) for (const id of filter.ids) identifiers.push({ uid: id });
    if (filter?.emails)
      for (const email of filter.emails) identifiers.push({ email });

    const users = identifiers.length
      ? ((await this.auth.getUsers(identifiers)).users as User[])
      : ((await this.auth.listUsers()).users as User[]);

    return users.map(this.cleanUser) as User[];
  }

  isAdmin(user: User | DecodedUser): boolean {
    return this.checkRole(user, UserRole.ADMIN);
  }

  isManager(user: User | DecodedUser): boolean {
    return this.checkRole(user, UserRole.MANAGER);
  }

  isTrainer(user: User | DecodedUser): boolean {
    return this.checkRole(user, UserRole.TRAINER);
  }

  isAthlete(user: User | DecodedUser): boolean {
    return this.checkRole(user, UserRole.ATHLETE);
  }

  async deleteCollection(collectionPath: string) {
    await this.firestore.recursiveDelete(
      this.firestore.collection(collectionPath),
    );
  }

  /**
   * Recursively converts `Date` objects to Firestore `Timestamp` in an object.
   */
  convertDatesToTimestamps<T>(obj: T): FirestoreEntity<T> {
    if (obj instanceof Date)
      return Timestamp.fromDate(obj) as FirestoreEntity<T>;

    if (obj === null || typeof obj !== 'object')
      return obj as FirestoreEntity<T>;

    if (Array.isArray(obj))
      return obj.map((item) =>
        this.convertDatesToTimestamps(item),
      ) as FirestoreEntity<T>;

    const result: Record<string, unknown> = {};
    for (const key in obj)
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        result[key] = this.convertDatesToTimestamps(value);
      }

    return result as FirestoreEntity<T>;
  }

  onApplicationBootstrap() {
    this.logger.verbose(
      `Using Firestore Emulator: ${this.configService.get('FIRESTORE_EMULATOR_HOST')}`,
    );
    this.logger.verbose(
      `Using Auth Emulator: ${this.configService.get('FIREBASE_AUTH_EMULATOR_HOST')}`,
    );
    this.logger.verbose(
      `Using Storage Emulator: ${this.configService.get('FIREBASE_STORAGE_EMULATOR_HOST')}`,
    );
    this.logger.verbose(
      `Using Cloud Functions Emulator: ${this.configService.get('EVENTARC_EMULATOR')}`,
    );
  }

  checkRole(user: User | DecodedUser, role: UserRole): boolean {
    if (isUser(user)) return user?.customClaims?.role?.includes(role);
    return user?.role?.includes(role);
  }

  getRole(user: User | DecodedUser): UserRole {
    if (isUser(user)) return user?.customClaims?.role?.[0] || UserRole.ATHLETE;
    return user?.role?.[0] || UserRole.ATHLETE;
  }

  private cleanUser(user: User): Partial<User> {
    return {
      uid: user.uid,
      email: user.email,
      customClaims: user.customClaims,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      displayName: user.displayName,
    };
  }

  // Helper function to split array into chunks
  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size)
      chunks.push(array.slice(i, i + size));

    return chunks;
  }
}

function isUser(user: User | DecodedUser): user is User {
  return (user as User).customClaims !== undefined;
}
