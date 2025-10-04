import { Inject } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Query } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import type { CommonService } from '@src/common/service/common.service';
import type { Environment } from '@src/config/environment-validation-schema';

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
  configService: ConfigService<Environment>,
  commonService: CommonService,
): FirebaseClient {
  let credential: admin.credential.Credential;
  let databaseId: string | undefined;

  const envCredentials = configService.get('FIREBASE_CREDENTIALS');
  if (commonService.env.isProduction() || commonService.env.isStaging()) {
    credential = admin.credential.applicationDefault();
    databaseId = configService.get('FIREBASE_DATABASE_ID');
  } else if (envCredentials)
    credential = admin.credential.cert(JSON.parse(envCredentials));
  else
    credential = admin.credential.cert(
      require('../../serviceAccount-staging.json'),
    );

  const apps = getApps();
  const app = (
    !apps.length
      ? initializeApp(!credential ? undefined : { credential })
      : apps[0]
  ) as admin.app.App;

  const auth = getAuth(app);
  const firestore = getFirestore(app, databaseId);
  const storage = getStorage(app);

  if (!apps.length) {
    firestore.settings({ ignoreUndefinedProperties: true });
    const debugLogQueryTimes = configService.get(
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
