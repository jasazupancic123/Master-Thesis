import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { Auth } from '@src/common/decorator/auth.decorator';
import { RequestUser } from '@src/common/decorator/request-user.decorator';
import { User } from '@src/common/type/firebase-auth.type';

import { InstitutionService } from '../service/institution.service';

@ApiTags('Protocol')
@Controller(':institutionId/protocol')
export class ProtocolController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Get(':institutionId/protocol')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async findAllByInstitution(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
  ) {
    return this.institutionService.findAllProtocols(user, institutionId);
  }
}
