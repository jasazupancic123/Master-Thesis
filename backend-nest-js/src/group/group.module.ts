import { forwardRef, Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserModule } from '../user/user.module';
import { Group } from './entity/group.entity';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [
    // @ts-ignore
    FirebaseModule.forFeature([Group]),
    UserModule,
    forwardRef(() => TrainingModule),
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {
}
