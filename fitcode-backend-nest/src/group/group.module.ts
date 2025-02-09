import { forwardRef, Module } from '@nestjs/common';
import { GroupService } from './service/group.service';
import { GroupController } from './group.controller';
import { UserModule } from '../user/user.module';
import { TrainingModule } from '../training/training.module';
import { GroupRepository } from './repository/group.repository';

@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => TrainingModule)],
  controllers: [GroupController],
  providers: [GroupRepository, GroupService],
  exports: [GroupService],
})
export class GroupModule {}
