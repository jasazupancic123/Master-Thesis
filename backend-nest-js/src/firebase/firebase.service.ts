import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { App, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../config/environment-validation-schema';
import { UserRole } from '../user/enum/user-role.enum';
import { SportLevel } from '../user/enum/sport-level.enum';
import { readFile } from 'node:fs/promises';
import { COMPONENT_COLLECTION } from '../common/const/firestore.const';
import { Tree } from '../common/util/tree';
import { ComponentDto } from '../component/dto/component.dto';
import { CustomClaims } from '../common/type/custom-claims.type';
import { isDev } from '../common/util/node-env';

@Injectable()
export class FirebaseService implements OnApplicationBootstrap {
  private logger: Logger;

  public readonly app: App;
  public readonly auth: admin.auth.Auth;
  public readonly firestore: admin.firestore.Firestore;
  public readonly storage: admin.storage.Storage;

  constructor(private readonly configService: ConfigService<Environment>) {
    this.logger = new Logger(FirebaseService.name);
    const apps = getApps();
    const config = {credential: admin.credential.cert('service-account.json')}

    this.logger.log(`Using Firestore Emulator: ${this.configService.get('FIRESTORE_EMULATOR_HOST')}`);
    this.logger.log(`Using Auth Emulator: ${this.configService.get('FIREBASE_AUTH_EMULATOR_HOST')}`);
    this.logger.log(`Using Storage Emulator: ${this.configService.get('FIREBASE_STORAGE_EMULATOR_HOST')}`);
    this.logger.log(`Using Cloud Functions Emulator: ${this.configService.get('EVENTARC_EMULATOR')}`);

    this.app = !this.app && !apps.length ? initializeApp(config) : apps[0];
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.firestore.settings({ ignoreUndefinedProperties: true })
  }

  async onApplicationBootstrap() {
    // create admin user if not exists
    const email = this.configService.get('FIREBASE_ADMIN_EMAIL');
    const password = this.configService.get('FIREBASE_ADMIN_PASSWORD');
    await this.createUser(email, password, UserRole.ADMIN);

    if (isDev()) {
      await this.createUser('manager@mail.com', 'password', UserRole.MANAGER);
      await this.createUser('trainer@mail.com', 'password', UserRole.TRAINER);
      await this.createUser('athlete@mail.com', 'password', UserRole.ATHLETE);
    }

    // import components if they do not exist
    const components = await this.firestore.collection(COMPONENT_COLLECTION).get();
    if (components.empty) {
      await this.importComponents('data/components.json');
      this.logger.log('Components imported');
    } else
      this.logger.log('Components collection already exists');
  }

  collection(name: string) {
    return this.firestore.collection(name);
  }

  isAdmin(user: CustomClaims): boolean {
    return user.role?.includes(UserRole.ADMIN) ?? false;
  }

  isManager(user: CustomClaims): boolean {
    return user.role?.includes(UserRole.MANAGER) ?? false;
  }

  isTrainer(user: CustomClaims): boolean {
    return user.role?.includes(UserRole.TRAINER) ?? false;
  }

  isAthlete(user: CustomClaims): boolean {
    return user.role?.includes(UserRole.ATHLETE) ?? false;
  }

  private async createUser(email: string, password: string, role: UserRole) {
    let user: UserRecord;

    try {
      user = await this.auth.getUserByEmail(email)
    } catch (e) {
      user = await this.auth.createUser({ email, password });
      await new Promise((resolve) => setTimeout(resolve, 5000)); // wait for cloud function to add role and level
    } finally {
      // update custom claims
      await this.auth.setCustomUserClaims(user.uid, {
        role: [role],
        level: SportLevel.ADVANCED
      });
    }

    this.logger.log(`(${role}) user created -> ${email}`);
    return user;
  }

  private async importComponents(filename: string) {
    const collection = this.firestore.collection(COMPONENT_COLLECTION);
    const data = await readFile(filename, 'utf-8');
    const parsed = JSON.parse(data);

    Tree.forEach<ComponentDto, string>(parsed, 'children', async ({ name }, parent, result) => {
      const document = await collection.add({ name, parentId: result ?? null });
      return document.id; // used in the next iteration as parent id
    });
  }
}
