import admin from 'firebase-admin';

import type { NodeEnv } from '@src/config/environment-validation-schema';
import { FirebaseService } from '@src/firebase/firebase.service';
import { getFirebaseClient } from '@src/firebase/get-firebase-client';

import { setupConfig } from './setup-config';

export function setupFirebase() {
  const { common, config } = setupConfig();

  const credential = admin.credential.cert(
    (process.env.NODE_ENV as NodeEnv) === 'production'
      ? require('../../serviceAccount-production.json')
      : require('../../serviceAccount-staging.json'),
  );

  const client = getFirebaseClient(config, common, { credential });
  const firebase = new FirebaseService(config, common, client);

  return { firebase, config, common };
}
