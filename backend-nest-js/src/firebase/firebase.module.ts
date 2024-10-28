import { DynamicModule, Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseMiddleware } from './firebase.middleware';
import {
  FIREBASE_ADMIN,
  FirebaseClient,
  getFirebaseClient,
} from './get-firebase-client';
import { ConfigService } from '@nestjs/config';
import {
  getEntityMetadata,
  getRepositoryToken,
} from '../common/decorator/entity.decorator';
import { FirestoreRepository } from './firestore.repository';
import { BaseEntity } from '../common/entity/base.entity';
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

            // if (commonService.env.isProd())
            //   await client.storage.bucket('media').makePublic();

            return getFirebaseClient({ credential });
          },
        },
        FirebaseService,
        FirebaseMiddleware,
      ],
      exports: [FIREBASE_ADMIN, FirebaseService, FirebaseMiddleware],
    };
  }

  static forFeature<T extends BaseEntity>(entities: T[] = []): DynamicModule {
    const providers = entities.map((entity) => {
      const name = getEntityMetadata(entity as any);
      if (!name) throw new Error(`Entity ${entity} has no collection name`);

      return {
        provide: getRepositoryToken(entity as any),
        inject: [FIREBASE_ADMIN],
        useFactory: (firebase: FirebaseClient) =>
          new (class extends FirestoreRepository<T> {
            constructor() {
              super(firebase, name);
            }
          })(),
      };
    });

    return {
      module: FirebaseModule,
      providers,
      exports: providers,
    };
  }
}
