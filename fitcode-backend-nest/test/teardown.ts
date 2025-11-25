import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { TestAuth } from '@src/common/utils/test-auth.util';
import type {
  Environment,
  NodeEnv,
} from '@src/config/environment-validation-schema';
import { FirebaseService } from '@src/firebase/firebase.service';
import { getFirebaseClient } from '@src/firebase/get-firebase-client';

const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
if (!['production', 'staging'].includes(nodeEnv))
  // in production and staging, the environment variables are set in other ways
  config({ quiet: true, path: `.env.${nodeEnv}` });

export default async function () {
  const commonService = new CommonService();
  const configService = new ConfigService<Environment>();

  const firebaseAdminClient = getFirebaseClient(configService, commonService);
  const firebase = new FirebaseService(
    configService,
    commonService,
    firebaseAdminClient,
  );

  await Promise.all([
    firebase.deleteCollection(FirestoreCollection.META),
    firebase.deleteCollection(FirestoreCollection.EXERCISE),
    firebase.deleteCollection(FirestoreCollection.INSTITUTION),
    firebase.deleteCollection(FirestoreCollection.WELLNESS),
    firebase.deleteCollection(FirestoreCollection.GROUP),
    firebase.deleteCollection(FirestoreCollection.TRAINING),
    firebase.deleteCollection(FirestoreCollection.PROFILE),
  ]);

  const auth = new TestAuth(firebase);
  await auth.deleteUsers([
    global.athlete.uid,
    global.trainer.uid,
    global.manager.uid,
    global.admin.uid,
  ]);
}
