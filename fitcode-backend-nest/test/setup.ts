/* eslint-disable simple-import-sort/imports */
import 'tsconfig-paths/register';

import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

import { CommonService } from '@src/common/service/common.service';
import type {
  Environment,
  NodeEnv,
} from '@src/config/environment-validation-schema';
import { FirebaseService } from '@src/firebase/firebase.service';
import { getFirebaseClient } from '@src/firebase/get-firebase-client';
import { TestAuth } from '@src/common/utils/test-auth.util';

const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
if (!['production', 'staging'].includes(nodeEnv))
  // in production and staging, the environment variables are set in other ways
  config({ quiet: true, path: `.env.${nodeEnv}` });

export default async function () {
  const commonService = new CommonService();
  const configService = new ConfigService<Environment>();

  const firebaseAdminClient = getFirebaseClient(configService, commonService);
  const firebaseService = new FirebaseService(
    configService,
    commonService,
    firebaseAdminClient,
  );

  const auth = new TestAuth(firebaseService);

  [global.athlete, global.trainer, global.manager, global.admin] =
    await Promise.all([
      auth.createAthlete('athlete'),
      auth.createTrainer('trainer'),
      auth.createManager('manager'),
      auth.createAdmin('admin'),
    ]);
}
