import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Environment } from '@src/config/environment-validation-schema';

import { CommonService } from '../common/service/common.service';
import { FirebaseService } from './firebase.service';
import { FIREBASE_ADMIN, getFirebaseClient } from './get-firebase-client';

@Global()
@Module({})
export class FirebaseModule {
  static forRoot(): DynamicModule {
    return {
      module: FirebaseModule,
      providers: [
        {
          provide: FIREBASE_ADMIN,
          inject: [ConfigService<Environment>, CommonService],
          useFactory: async (
            configService: ConfigService<Environment>,
            commonService: CommonService,
          ) => {
            return getFirebaseClient(configService, commonService);
          },
        },
        FirebaseService,
      ],
      exports: [FIREBASE_ADMIN, FirebaseService],
    };
  }
}
