import { Module } from '@nestjs/common';

import { InstitutionModule } from '../institution/institution.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupRepository } from './repository/group.repository';

@Module({
  imports: [InstitutionModule],
  controllers: [GroupController],
  providers: [GroupRepository, GroupService],
  exports: [GroupService],
})
export class GroupModule {}
