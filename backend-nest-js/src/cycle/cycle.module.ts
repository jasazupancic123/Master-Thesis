import { forwardRef, Module } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CycleController } from './cycle.controller';
import { GroupModule } from '../group/group.module';
import { TrainingModule } from '../training/training.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { CycleDto } from './dto/cycle.dto';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([CycleDto]),
    GroupModule,
    forwardRef(() => TrainingModule)
  ],
  controllers: [CycleController],
  providers: [CycleService],
  exports: [CycleService]
})
export class CycleModule {}
