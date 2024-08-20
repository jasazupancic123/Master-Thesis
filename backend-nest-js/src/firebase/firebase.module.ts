import { DynamicModule, Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseMiddleware } from './firebase.middleware';
import { FIREBASE_ADMIN, FirebaseClient, FirebaseClientOptions, getFirebaseClient } from './get-firebase-client';
import { ConfigService } from '@nestjs/config';
import { getEntityMetadata, getRepositoryToken } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from './firestore.repository';
import { BaseEntity } from '../common/entity/base.entity';

@Global()
@Module({})
export class FirebaseModule {
  static forRoot(options: FirebaseClientOptions): DynamicModule {
    return {
      module: FirebaseModule,
      providers: [
        {
          provide: FIREBASE_ADMIN,
          inject: [ConfigService],
          useFactory: async () =>
            getFirebaseClient(options),
        },
        FirebaseService,
        FirebaseMiddleware,
      ],
      exports: [FIREBASE_ADMIN, FirebaseService, FirebaseMiddleware],
    };
  }

  static forFeature<T extends BaseEntity>(entities: T[] = []): DynamicModule {
    const providers = entities.map(entity => {
      const name = getEntityMetadata(entity as any);
      if (!name)
        throw new Error(`Entity ${entity} has no collection name`);

      return {
        provide: getRepositoryToken(entity as any),
        inject: [FIREBASE_ADMIN],
        useFactory: (firebase: FirebaseClient) => new class extends FirestoreRepository<T> {
          constructor() {
            super(firebase, name);
          }
        },
      };
    });

    return {
      module: FirebaseModule,
      providers,
      exports: providers,
    };
  }
}