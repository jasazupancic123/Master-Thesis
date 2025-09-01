import { DynamicModule, Global, Module } from '@nestjs/common';

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
          inject: [CommonService],
          useFactory: async (commonService: CommonService) => {
            return getFirebaseClient(commonService);
          },
        },
        FirebaseService,
      ],
      exports: [FIREBASE_ADMIN, FirebaseService],
    };
  }
}
