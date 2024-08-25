import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../config/environment-validation-schema';
import { UserRole } from '../user/enum/user-role.enum';
import { DecodedUser, User } from '../common/type/custom-claims.type';
import { FirebaseClient, InjectFirebaseAdmin } from './get-firebase-client';

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

  collection(name: string) {
    return this.firestore.collection(name);
  }

  async findUserById(uid: string) {
    return await this.auth.getUser(uid) as User;
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

  private checkRole(user: User | DecodedUser, role: UserRole): boolean {
    if (isUser(user))
      return user.customClaims.role.includes(role);

    return user.role.includes(role);
  }
}

function isUser(user: User | DecodedUser): user is User {
  return (user as User).customClaims !== undefined;
}