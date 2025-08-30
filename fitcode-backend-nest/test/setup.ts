/* eslint-disable simple-import-sort/imports */
import 'tsconfig-paths/register';

import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

import { CommonService } from '@src/common/service/common.service';
import type { Environment } from '@src/config/environment-validation-schema';
import { FirebaseService } from '@src/firebase/firebase.service';
import { getFirebaseClient } from '@src/firebase/get-firebase-client';

import {
  createAdminUserAndToken,
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from '@test/common/utils/auth.util';

config({ quiet: true });

export default async function () {
  const commonService = new CommonService();
  const configService = new ConfigService<Environment>();

  const credential = JSON.parse(configService.get('FIREBASE_CONFIG'));
  const firebaseAdminClient = getFirebaseClient({ credential });
  const firebaseService = new FirebaseService(
    configService,
    commonService,
    firebaseAdminClient,
  );

  [global.athlete, global.trainer, global.manager, global.admin] =
    await Promise.all([
      createAthleteUserAndToken(firebaseService),
      createTrainerUserAndToken(firebaseService),
      createManagerUserAndToken(firebaseService),
      createAdminUserAndToken(firebaseService),
    ]);
}
