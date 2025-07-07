import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../src/firebase/firebase.service';
import { Environment } from '../src/config/environment-validation-schema';
import { CommonService } from '../src/common/service/common.service';
import { getFirebaseClient } from '../src/firebase/get-firebase-client';
import { TestUser } from './common/type/auth.type';
import {
  createAdminUserAndToken,
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from './common/utils/auth.util';
import { config } from 'dotenv';

declare global {
  var athlete: TestUser;
  var trainer: TestUser;
  var manager: TestUser;
  var admin: TestUser;
}

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

  [global.athlete, global.trainer, global.manager, global.admin] =
    await Promise.all([
      createAthleteUserAndToken(firebaseService),
      createTrainerUserAndToken(firebaseService),
      createManagerUserAndToken(firebaseService),
      createAdminUserAndToken(firebaseService),
    ]);
}
