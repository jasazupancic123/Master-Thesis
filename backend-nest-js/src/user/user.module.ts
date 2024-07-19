import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserService } from './user.service';

@Module({
  imports: [FirebaseModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
