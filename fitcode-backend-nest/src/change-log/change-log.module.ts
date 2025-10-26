import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { ChangeLogManager } from './change-log.manager';

@Global()
@Module({})
export class ChangeLogModule {
  static forEntity<T>(entityClass: Type<T>): DynamicModule {
    const provider: Provider = {
      provide: entityClass,
      useFactory: (firebase: FirebaseService) =>
        new ChangeLogManager<T>(firebase),
    };

    return {
      module: ChangeLogModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
