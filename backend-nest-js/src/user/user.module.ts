import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { Wellness } from './entity/wellness.entity';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([Wellness]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {
}
