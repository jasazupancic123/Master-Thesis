import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '@src/auth/auth.module';

import { GroupController } from './controller/group.controller';
import { InstitutionController } from './controller/institution.controller';
import { MemberController } from './controller/member.controller';
import { ProtocolController } from './controller/protocol.controller';
import { GroupRepository } from './repository/group.repository';
import { InstitutionRepository } from './repository/institution.repository';
import { InstitutionMembersRepository } from './repository/institution-members.repository';
import { ProtocolRepository } from './repository/protocol.repository';
import { GroupService } from './service/group.service';
import { InstitutionService } from './service/institution.service';
import { MemberService } from './service/member.service';
import { ProtocolService } from './service/protocol.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    InstitutionController,
    GroupController,
    MemberController,
    ProtocolController,
  ],
  providers: [
    InstitutionRepository,
    GroupRepository,
    InstitutionMembersRepository,
    ProtocolRepository,
    InstitutionService,
    GroupService,
    MemberService,
    ProtocolService,
  ],
  exports: [InstitutionService, ProtocolService, GroupService],
})
export class InstitutionModule {}
