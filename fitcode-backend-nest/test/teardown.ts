import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../src/firebase/firebase.service';
import { Environment } from '../src/config/environment-validation-schema';
import { CommonService } from '../src/common/service/common.service';
import { getFirebaseClient } from '../src/firebase/get-firebase-client';
import { FirestoreCollection } from '../src/common/enum/firestore-collection.enum';
import { config } from 'dotenv';

config();

export default async function () {
  const commonService = new CommonService();
  const configService = new ConfigService<Environment>();

  const credential = JSON.parse(configService.get('FIREBASE_CREDENTIALS'));
  const firebaseAdminClient = getFirebaseClient({ credential });
  const firebaseService = new FirebaseService(
    configService,
    commonService,
    firebaseAdminClient,
  );

  const users = [global.athlete, global.trainer, global.manager, global.admin];
  await firebaseService.auth.deleteUsers(users.map((u) => u.uid));
  await firebaseService.deleteCollection(FirestoreCollection.USER);
  await firebaseService.deleteCollection(FirestoreCollection.COMPONENT);
  await firebaseService.deleteCollection(FirestoreCollection.ATTRIBUTE);
  await firebaseService.deleteCollection(FirestoreCollection.PARAM);
  await firebaseService.deleteCollection(FirestoreCollection.GROUP);
  await firebaseService.deleteCollection(FirestoreCollection.LOCAL_DEV);
  await firebaseService.deleteCollection(FirestoreCollection.TRAINING_STATUS);
  await firebaseService.deleteCollection(FirestoreCollection.TRAINING_WORKLOAD);
}
