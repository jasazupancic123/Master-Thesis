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
import { Component } from '../src/component/entity/component.entity';
import { ComponentService } from '../src/component/component.service';
import { ComponentRepository } from '../src/component/repository/component.repository';
import { config } from 'dotenv';
import { importComponents } from './utils/data.util';

declare global {
  var athlete: TestUser;
  var trainer: TestUser;
  var manager: TestUser;
  var admin: TestUser;
  var components: Component[];
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

  const componentRepository = new ComponentRepository(
    commonService,
    firebaseService,
  );

  const componentService = new ComponentService(
    commonService,
    componentRepository,
  );

  global.athlete = await createAthleteUserAndToken(firebaseService);
  global.trainer = await createTrainerUserAndToken(firebaseService);
  global.manager = await createManagerUserAndToken(firebaseService);
  global.admin = await createAdminUserAndToken(firebaseService);
  global.components = await importComponents(componentService);
}
