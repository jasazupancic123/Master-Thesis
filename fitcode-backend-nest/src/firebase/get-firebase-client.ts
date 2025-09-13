import { Inject } from '@nestjs/common';
import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Query } from 'firebase-admin/firestore';
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
  const envCredentials = commonService.env.getKey('FIREBASE_CREDENTIALS');
  let credential: admin.credential.Credential;

  if (commonService.env.isProd())
    credential = admin.credential.applicationDefault();
  else if (envCredentials)
    credential = admin.credential.cert(JSON.parse(envCredentials));
  else credential = admin.credential.cert(require('../../serviceAccount.json'));

  const apps = getApps();
  const app = (
    !apps.length ? initializeApp({ credential }) : apps[0]
  ) as admin.app.App;

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  if (!apps.length) {
    firestore.settings({ ignoreUndefinedProperties: true });

    const debugLogQueryTimes = commonService.env.getKey(
      'DEBUG_FIRESTORE_QUERY_TIME_LOGGING',
    );

    if (debugLogQueryTimes) logQueryTimes();
  }

  return { app, auth, firestore, storage };
}

function logQueryTimes() {
  const originalGet = Query.prototype.get;
  Query.prototype.get = async function (...args: any[]) {
    const label = `Firestore query [${this._queryOptions?.collectionId || 'unknown'}]`;
    console.time(label);

    try {
      const result = await originalGet.apply(this, args);
      console.timeEnd(label);
      return result;
    } catch (err) {
      console.timeEnd(label);
      throw err;
    }
  };
}
