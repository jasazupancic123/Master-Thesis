import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { Auth } from '@src/common/decorator/auth.decorator';
import { RequestUser } from '@src/common/decorator/request-user.decorator';
import { UserIdDto } from '@src/common/dto/user-id.dto';
import { User } from '@src/common/type/firebase-auth.type';

import { InstitutionService } from '../service/institution.service';

@ApiTags('Institution Members')
@Controller('institution/:institutionId/member')
export class MemberController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Get()
  @Auth()
  async findAllByInstitution(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
  ) {
    return await this.institutionService.findAllMembers(user, institutionId);
  }

  @Patch('athlete')
  @Auth([UserRole.MANAGER])
  async addAthlete(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return await this.institutionService.updateMember(
      user,
      { institutionId },
      { add: true, userId, trainer: false },
    );
  }

  @Delete('athlete')
  @Auth([UserRole.MANAGER])
  async removeAthlete(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return await this.institutionService.updateMember(
      user,
      { institutionId },
      { add: false, userId, trainer: false },
    );
  }

  @Patch('trainer')
  @Auth([UserRole.MANAGER])
  async addTrainer(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return await this.institutionService.updateMember(
      user,
      { institutionId },
      { add: true, userId, trainer: true },
    );
  }

  @Delete('trainer')
  @Auth([UserRole.MANAGER])
  async removeTrainer(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return await this.institutionService.updateMember(
      user,
      { institutionId },
      { add: false, userId, trainer: true },
    );
  }
}
