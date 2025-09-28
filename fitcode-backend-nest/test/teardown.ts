import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import { deleteUsers } from '@src/common/utils/data.util';
import type {
  Environment,
  NodeEnv,
} from '@src/config/environment-validation-schema';
import { FirebaseService } from '@src/firebase/firebase.service';
import { getFirebaseClient } from '@src/firebase/get-firebase-client';

const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
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
    firebase.deleteCollection(FirestoreCollection.LOCAL_DEV),
    firebase.deleteCollection(FirestoreCollection.COMPONENT),
    firebase.deleteCollection(FirestoreCollection.METHOD),
    firebase.deleteCollection(FirestoreCollection.EXERCISE),
    firebase.deleteCollection(FirestoreCollection.INSTITUTION),
    firebase.deleteCollection(FirestoreCollection.WELLNESS),
    firebase.deleteCollection(FirestoreCollection.GROUP),
    firebase.deleteCollection(FirestoreCollection.TRAINING),
    deleteUsers(firebase, [
      global.athlete,
      global.trainer,
      global.manager,
      global.admin,
    ]),
  ]);
}
