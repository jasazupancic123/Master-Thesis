import { Module } from '@nestjs/common';

import { ChangeLogModule } from '@src/change-log/change-log.module';

import { InstitutionModule } from '../institution/institution.module';
import { Group } from './entity/group.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupRepository } from './repository/group.repository';

@Module({
  imports: [ChangeLogModule.forEntity(Group), InstitutionModule],
  controllers: [GroupController],
  providers: [GroupRepository, GroupService],
  exports: [GroupService],
})
export class GroupModule {}
