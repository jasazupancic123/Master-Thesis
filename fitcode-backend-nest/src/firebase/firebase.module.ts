import { DynamicModule, Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseMiddleware } from './firebase.middleware';
import { FIREBASE_ADMIN, getFirebaseClient } from './get-firebase-client';
import { ConfigService } from '@nestjs/config';
import { CommonService } from '../common/service/common.service';

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
            commonService: CommonService,
          ) => {
            const credential = JSON.parse(
              configService.get('FIREBASE_CREDENTIALS'),
            );

            // if (commonService.env.isProd()) await client.storage.bucket('media').makePublic();
            return getFirebaseClient({ credential });
          },
        },
        FirebaseService,
        FirebaseMiddleware,
      ],
      exports: [FIREBASE_ADMIN, FirebaseService, FirebaseMiddleware],
    };
  }
}
