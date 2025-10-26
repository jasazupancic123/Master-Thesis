import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserIdDto } from '@src/common/dto/user-id.dto';

import { UserRole } from '../auth/enum/user-role.enum';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { InstitutionService } from './service/institution.service';

@ApiTags('Institution')
@Controller('institution')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return this.institutionService.findAll(user);
  }

  @Get(':institutionId')
  @Auth([UserRole.ADMIN, UserRole.TRAINER, UserRole.ATHLETE])
  async findById(@Param('institutionId') institutionId: string) {
    return this.institutionService.findByIdOrFail({ institutionId });
  }

  @Get(':institutionId/members')
  @Auth([UserRole.ADMIN, UserRole.TRAINER, UserRole.MANAGER])
  async findMembers(@Param('institutionId') institutionId: string) {
    return this.institutionService.findMembers({ institutionId });
  }

  @Post()
  @Auth([UserRole.ADMIN])
  async create(@RequestUser() user: User, @Body() body: CreateInstitutionDto) {
    return this.institutionService.create(user, body);
  }

  @Patch(':institutionId')
  @Auth([UserRole.MANAGER])
  async update(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() body: UpdateInstitutionDto,
  ) {
    return this.institutionService.update(user, { institutionId }, body);
  }

  @Patch(':institutionId/athlete')
  @Auth([UserRole.MANAGER])
  async addAthlete(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return this.institutionService.updateMembers(
      user,
      { institutionId },
      { add: true, userId, trainer: false },
    );
  }

  @Delete(':institutionId/athlete')
  @Auth([UserRole.MANAGER])
  async removeAthlete(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return this.institutionService.updateMembers(
      user,
      { institutionId },
      { add: false, userId, trainer: false },
    );
  }

  @Patch(':institutionId/trainer')
  @Auth([UserRole.MANAGER])
  async addTrainer(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return this.institutionService.updateMembers(
      user,
      { institutionId },
      { add: true, userId, trainer: true },
    );
  }

  @Delete(':institutionId/trainer')
  @Auth([UserRole.MANAGER])
  async removeTrainer(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return this.institutionService.updateMembers(
      user,
      { institutionId },
      { add: false, userId, trainer: true },
    );
  }
}
