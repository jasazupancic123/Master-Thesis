import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { CommonService } from '@src/common/service/common.service';
import type { FirestoreEntity } from '@src/common/type/entity.type';
import type {
  Environment,
  NodeEnv,
} from '@src/config/environment-validation-schema';
import { FirebaseService } from '@src/firebase/firebase.service';
import { getFirebaseClient } from '@src/firebase/get-firebase-client';
import type { Institution } from '@src/institution/entity/institution.entity';
import type {
  InstitutionMember,
  PartialInstitutionMember,
} from '@src/institution/entity/institution-member.entity';

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

  const institutions = (
    await firebase.firestore.collection(FirestoreCollection.INSTITUTION).get()
  ).docs.map((doc) =>
    firebase.serialize(doc.data() as FirestoreEntity<Institution>),
  );

  for (const institution of institutions) {
    const subcollectionRef = firebase.firestore
      .collection(FirestoreCollection.INSTITUTION)
      .doc(institution.id)
      .collection(FirestoreCollection.INSTITUTION_MEMBERS);

    const members = (await subcollectionRef.get()).docs.map((doc) =>
      firebase.serialize(doc.data() as FirestoreEntity<InstitutionMember>),
    );

    const cachedMembers: PartialInstitutionMember[] = members.map((member) => ({
      id: member.id,
      role: member.role,
    }));

    // update institution with cached members
    await firebase.firestore
      .collection(FirestoreCollection.INSTITUTION)
      .doc(institution.id)
      .update({ members: cachedMembers });

    console.log(
      `Updating institution ${institution.id} with ${cachedMembers.length} cached members`,
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
