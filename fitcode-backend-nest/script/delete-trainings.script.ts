import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import type { Environment } from '@src/config/environment-validation-schema';
import { FirebaseService } from '@src/firebase/firebase.service';
import { getFirebaseClient } from '@src/firebase/get-firebase-client';

const serviceAccount = require('../serviceAccount-production.json');

async function bootstrap() {
  const common = new CommonService();
  const config = new ConfigService<Environment>();
  const client = getFirebaseClient(config, common, {
    credential: admin.credential.cert(serviceAccount),
  });

  const firebase = new FirebaseService(config, common, client);
  await firebase.firestore.recursiveDelete(
    firebase.firestore.collection(FirestoreCollection.TRAINING),
  );
}

bootstrap()
  .then(() => {
    console.log('Trainings deleted successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error deleting trainings:', err);
    process.exit(1);
  });
