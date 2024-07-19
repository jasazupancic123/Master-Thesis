import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseMiddleware } from './firebase.middleware';

@Module({
  providers: [FirebaseService, FirebaseMiddleware],
  exports: [FirebaseService, FirebaseMiddleware]
})
export class FirebaseModule {}
