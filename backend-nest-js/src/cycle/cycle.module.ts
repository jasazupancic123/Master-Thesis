import { Module } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CycleController } from './cycle.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { GroupModule } from '../group/group.module';

@Module({
  controllers: [CycleController],
  imports: [FirebaseModule, GroupModule],
  providers: [CycleService],
  exports: [CycleService]
})
export class CycleModule {}
