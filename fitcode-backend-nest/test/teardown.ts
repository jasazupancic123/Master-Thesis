import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../src/firebase/firebase.service';
import { Environment } from '../src/config/environment-validation-schema';
import { CommonService } from '../src/common/service/common.service';
import { getFirebaseClient } from '../src/firebase/get-firebase-client';
import { config } from 'dotenv';
import { deleteUsers } from './utils/data.util';

config();

export default async function () {
  const commonService = new CommonService();
  const configService = new ConfigService<Environment>();

  const credential = JSON.parse(configService.get('FIREBASE_CREDENTIALS'));
  const firebaseAdminClient = getFirebaseClient({ credential });
  const firebase = new FirebaseService(
    configService,
    commonService,
    firebaseAdminClient,
  );

  await deleteUsers(firebase, [
    global.athlete,
    global.trainer,
    global.manager,
    global.admin,
  ]);

  await Promise.all([
    /* firebase.auth.deleteUsers(users.map((u) => u.uid)),
    firebaseService.deleteCollection(FirestoreCollection.LOCAL_DEV),
    firebaseService.deleteCollection(FirestoreCollection.USER),
    firebaseService.deleteCollection(FirestoreCollection.COMPONENT),
    firebaseService.deleteCollection(FirestoreCollection.ATTRIBUTE),
    firebaseService.deleteCollection(FirestoreCollection.EXERCISE),
    firebaseService.deleteCollection(FirestoreCollection.WELLNESS),
    firebaseService.deleteCollection(FirestoreCollection.GROUP),
    firebaseService.deleteCollection(FirestoreCollection.TRAINING),
    firebaseService.deleteCollection(FirestoreCollection.INSTITUTION),
    firebaseService.deleteCollection(FirestoreCollection.METHOD), */
  ]);
}
