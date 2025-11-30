import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';

import { CommonService } from '@src/common/service/common.service';
import type { FirestoreEntity } from '@src/common/type/entity.type';
import type {
  Environment,
  NodeEnv,
} from '@src/config/environment-validation-schema';
import { FirebaseService } from '@src/firebase/firebase.service';
import { getFirebaseClient } from '@src/firebase/get-firebase-client';
import type { Group } from '@src/institution/entity/group.entity';

const nodeEnv = process.env.NODE_ENV as NodeEnv;

async function bootstrap() {
  const common = new CommonService();
  const config = new ConfigService<Environment>();

  const firebase = new FirebaseService(
    config,
    common,
    getFirebaseClient(config, common, {
      credential: admin.credential.cert(
        nodeEnv === 'production'
          ? require('../serviceAccount-production.json')
          : require('../serviceAccount-staging.json'),
      ),
    }),
  );

  const groups = (await firebase.firestore.collection('groups').get()).docs.map(
    (doc) => firebase.serialize(doc.data() as FirestoreEntity<Group>),
  );

  for (const group of groups) {
    const groupId = group.id;
    const institutonId = group.institutionId;

    const subcollectionRef = firebase.firestore
      .collection('institutions')
      .doc(institutonId)
      .collection('groups');

    await subcollectionRef.doc(groupId).set({
      ...group,
    });

    console.log(
      `Moved group ${groupId} to institution ${institutonId} subcollection`,
    );
  }
}

bootstrap()
  .then(() => {
    console.log('successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
