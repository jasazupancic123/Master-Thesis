import { Inject } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import type { AppOptions } from 'firebase-admin/app';
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
  overrideOptions?: AppOptions,
): FirebaseClient {
  const options: AppOptions = {};

  const envCredentials = configService.get('FIREBASE_CREDENTIALS');
  if (commonService.env.isProduction() || commonService.env.isStaging())
    options.credential = admin.credential.applicationDefault();
  else if (envCredentials)
    options.credential = admin.credential.cert(JSON.parse(envCredentials));
  else if (commonService.env.isDev() || commonService.env.isTest())
    options.projectId = 'demo';

  const apps = getApps();
  const app = (
    !apps.length
      ? initializeApp(overrideOptions ? overrideOptions : options)
      : apps[0]
  ) as admin.app.App;

  const auth = getAuth(app);
  const firestore = getFirestore(app);
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
    // eslint-disable-next-line no-console
    console.time(label);

    try {
      const result = await originalGet.apply(this, args);
      // eslint-disable-next-line no-console
      console.timeEnd(label);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.timeEnd(label);
      throw err;
    }
  };
}
