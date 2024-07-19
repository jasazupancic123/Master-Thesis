import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  controllers: [GroupController],
  providers: [GroupService],
  imports: [FirebaseModule],
  exports: [GroupService]
})
export class GroupModule {}
