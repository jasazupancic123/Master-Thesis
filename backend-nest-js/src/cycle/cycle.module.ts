import { forwardRef, Module } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CycleController } from './cycle.controller';
import { GroupModule } from '../group/group.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { Cycle } from '../group/entity/cycle.entity';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([Cycle]),
    forwardRef(() => GroupModule),
  ],
  controllers: [CycleController],
  providers: [CycleService],
  exports: [CycleService],
})
export class CycleModule {
}
