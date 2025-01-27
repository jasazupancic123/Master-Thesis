import * as admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { Inject, Logger } from '@nestjs/common';

export const FIREBASE_ADMIN = Symbol('FirebaseAdmin');

export function InjectFirebaseAdmin() {
  return Inject(FIREBASE_ADMIN);
}

export interface FirebaseClient {
  app: admin.app.App;
  auth: admin.auth.Auth;
  firestore: admin.firestore.Firestore;
  storage: admin.storage.Storage;
}

export interface FirebaseClientOptions {
  credential: string;
}

export function getFirebaseClient(
  options: FirebaseClientOptions,
): FirebaseClient {
  const logger = new Logger(getFirebaseClient.name);
  logger.debug('Initializing Firebase Admin SDK');

  const apps = getApps();
  const config = {
    credential: admin.credential.cert(options.credential),
  };

  const app = (!apps.length ? initializeApp(config) : apps[0]) as admin.app.App;
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  firestore.settings({ ignoreUndefinedProperties: true });
  return { app, auth, firestore, storage };
}
