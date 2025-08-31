import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
          inject: [ConfigService, CommonService],
          useFactory: async (
            configService: ConfigService,
            // commonService: CommonService,
          ) => {
            const credential = JSON.parse(configService.get('FIREBASE_CONFIG'));
            // if (commonService.env.isProd()) await client.storage.bucket('media').makePublic();
            return getFirebaseClient({ credential });
          },
        },
        FirebaseService,
      ],
      exports: [FIREBASE_ADMIN, FirebaseService],
    };
  }
}
