import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../config/environment-validation-schema';
import { UserRole } from '../user/enum/user-role.enum';
import { DecodedUser, User } from '../common/type/firebase-auth.type';
import { FirebaseClient, InjectFirebaseAdmin } from './get-firebase-client';
import { Auth, ListUsersResult, UserIdentifier } from 'firebase-admin/auth';
import { Storage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnApplicationBootstrap {
  public readonly app: App;
  public readonly auth: Auth;
  public readonly firestore: admin.firestore.Firestore;
  public readonly storage: Storage;
  private logger = new Logger(this.constructor.name);

  constructor(
    private readonly configService: ConfigService<Environment>,
    @InjectFirebaseAdmin() private readonly firebaseAdmin: FirebaseClient,
  ) {
    this.app = this.firebaseAdmin.app;
    this.auth = this.firebaseAdmin.auth;
    this.firestore = this.firebaseAdmin.firestore;
    this.storage = this.firebaseAdmin.storage;
  }

  async findUserById(uid: string) {
    return (await this.auth.getUser(uid)) as User;
  }

  async authUsers(filter?: {
    ids?: string[];
    emails?: string[];
  }): Promise<User[]> {
    let users: ListUsersResult;

    if (filter) {
      // https://firebase.google.com/docs/auth/admin/manage-users#bulk_retrieve_user_data
      const identifiers: UserIdentifier[] = [];
      for (const id of filter.ids ?? []) identifiers.push({ uid: id });
      for (const email of filter.emails ?? []) identifiers.push({ email });
      users = await this.auth.getUsers(identifiers);
    } else users = await this.auth.listUsers();

    return users.users as User[];
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

  async onApplicationBootstrap() {
    this.logger.debug(
      `Using Firestore Emulator: ${this.configService.get('FIRESTORE_EMULATOR_HOST')}`,
    );
    this.logger.debug(
      `Using Auth Emulator: ${this.configService.get('FIREBASE_AUTH_EMULATOR_HOST')}`,
    );
    this.logger.debug(
      `Using Storage Emulator: ${this.configService.get('FIREBASE_STORAGE_EMULATOR_HOST')}`,
    );
    this.logger.debug(
      `Using Cloud Functions Emulator: ${this.configService.get('EVENTARC_EMULATOR')}`,
    );
  }

  private checkRole(user: User | DecodedUser, role: UserRole): boolean {
    if (isUser(user)) return user.customClaims.role.includes(role);
    return user.role.includes(role);
  }
}

function isUser(user: User | DecodedUser): user is User {
  return (user as User).customClaims !== undefined;
}
