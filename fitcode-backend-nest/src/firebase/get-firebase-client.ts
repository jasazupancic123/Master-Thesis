import { Inject } from '@nestjs/common';
import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import type { CommonService } from '@src/common/service/common.service';

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

export function getFirebaseClient(
  commonService: CommonService,
): FirebaseClient {
  const apps = getApps();
  const config = {
    ...(!commonService.env.isProd() && {
      credential: admin.credential.cert(require('../../serviceAccount.json')),
    }),
  };

  const app = (!apps.length ? initializeApp(config) : apps[0]) as admin.app.App;
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  if (!apps.length) firestore.settings({ ignoreUndefinedProperties: true });
  return { app, auth, firestore, storage };
}
