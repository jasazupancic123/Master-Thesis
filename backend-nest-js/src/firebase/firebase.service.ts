import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../config/environment-validation-schema';
import { UserRole } from '../user/enum/user-role.enum';
import { DecodedUser, User } from '../common/type/custom-claims.type';
import { FirebaseClient, InjectFirebaseAdmin } from './get-firebase-client';
import { DocumentData, DocumentSnapshot, QuerySnapshot, Timestamp } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseService implements OnApplicationBootstrap {
  public readonly app: App;
  public readonly auth: admin.auth.Auth;
  public readonly firestore: admin.firestore.Firestore;
  public readonly storage: admin.storage.Storage;
  private logger = new Logger(this.constructor.name);

  constructor(
    @InjectFirebaseAdmin() private readonly firebaseAdmin: FirebaseClient,
    private readonly configService: ConfigService<Environment>,
  ) {
    this.app = firebaseAdmin.app;
    this.auth = firebaseAdmin.auth;
    this.firestore = firebaseAdmin.firestore;
    this.storage = firebaseAdmin.storage;
  }

  async findUserById(uid: string) {
    return await this.auth.getUser(uid) as User;
  }
  
  async findUsers(): Promise<User[]> {
    return (await this.auth.listUsers()).users as User[];
  }

  serializeDocument<T>(data: DocumentSnapshot): T & { id: string } {
    const item = this.convertTimestampToDate(data.data());
    return { id: data.id, ...item } as T & { id: string };
  }

  serialize<T>(data: QuerySnapshot): (T & { id: string })[] {
    return data.docs.map(doc => {
      const item = this.convertTimestampToDate(doc.data());
      return { id: doc.id, ...item } as T & { id: string };
    }) as (T & { id: string })[];
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

  async onApplicationBootstrap() {
    this.logger.debug(`Using Firestore Emulator: ${this.configService.get('FIRESTORE_EMULATOR_HOST')}`);
    this.logger.debug(`Using Auth Emulator: ${this.configService.get('FIREBASE_AUTH_EMULATOR_HOST')}`);
    this.logger.debug(`Using Storage Emulator: ${this.configService.get('FIREBASE_STORAGE_EMULATOR_HOST')}`);
    this.logger.debug(`Using Cloud Functions Emulator: ${this.configService.get('EVENTARC_EMULATOR')}`);
  }

  private convertTimestampToDate(data: DocumentData) {
    let obj = { ...data };
    for (const key in obj)
      if (obj[key] instanceof Timestamp)
        obj[key] = (obj[key] as Timestamp).toDate();

    return obj;
  }

  private checkRole(user: User | DecodedUser, role: UserRole): boolean {
    if (isUser(user))
      return user.customClaims.role.includes(role);

    return user.role.includes(role);
  }
}

function isUser(user: User | DecodedUser): user is User {
  return (user as User).customClaims !== undefined;
}