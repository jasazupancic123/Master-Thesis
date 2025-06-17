import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../src/firebase/firebase.service';
import { Environment } from '../src/config/environment-validation-schema';
import { CommonService } from '../src/common/service/common.service';
import { getFirebaseClient } from '../src/firebase/get-firebase-client';
import { TestUser } from './type/auth.type';
import {
  createAdminUserAndToken,
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from './utils/auth.util';
import { config } from 'dotenv';
import { UserService } from '../src/user/user.service';
import { UserRepository } from '../src/user/repository/user.repository';
import { WellnessRepository } from '../src/user/repository/user-meta.repository';

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

  const userRepository = new UserRepository(commonService, firebaseService);
  const userService = new UserService(
    configService,
    firebaseService,
    userRepository,
    new WellnessRepository(commonService, userRepository),
  );

  global.athlete = await createAthleteUserAndToken(firebaseService);
  global.trainer = await createTrainerUserAndToken(firebaseService);
  global.manager = await createManagerUserAndToken(firebaseService);
  global.admin = await createAdminUserAndToken(firebaseService);
}
