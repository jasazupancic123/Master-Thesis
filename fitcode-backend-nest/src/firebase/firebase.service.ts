import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { Auth, UserIdentifier } from 'firebase-admin/auth';
import {
  DocumentReference,
  GeoPoint,
  Timestamp,
} from 'firebase-admin/firestore';
import { Storage } from 'firebase-admin/storage';
import { TimestampEntity } from '../common/entity/timestamp.entity';
import { CommonService } from '../common/service/common.service';
import { Create, FirestoreEntity, Update } from '../common/type/entity.type';
import { DecodedUser, User } from '../common/type/firebase-auth.type';
import { Environment } from '../config/environment-validation-schema';
import { UserRole } from '../user/enum/user-role.enum';
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

    const result: Record<string, any> = {};
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
    let identifiers: UserIdentifier[] = [];
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

    const result: Record<string, any> = {};
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

  private checkRole(user: User | DecodedUser, role: UserRole): boolean {
    if (isUser(user)) return user.customClaims.role.includes(role);
    return user.role.includes(role);
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
}

function isUser(user: User | DecodedUser): user is User {
  return (user as User).customClaims !== undefined;
}
