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

import { UserRole } from '@src/auth/enum/user-role.enum';
import { Auth } from '@src/common/decorator/auth.decorator';
import { RequestUser } from '@src/common/decorator/request-user.decorator';
import { UserIdDto } from '@src/common/dto/user-id.dto';
import { User } from '@src/common/type/firebase-auth.type';
import { GroupRef } from '@src/common/type/firestore.type';

import { CreateGroupDto } from '../dto/create-group.dto';
import { BatchUpdateGroupsDto, UpdateGroupDto } from '../dto/update-group.dto';
import { Cycle } from '../entity/cycle.entity';
import { GroupService } from '../service/group.service';
import { InstitutionService } from '../service/institution.service';

@ApiTags('Group')
@Controller('institution/:institutionId/group')
export class GroupController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly groupService: GroupService,
  ) {}

  @Get()
  @Auth()
  async findAllByInstitution(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
  ) {
    return await this.institutionService.findAllGroups(user, institutionId);
  }

  @Post()
  @Auth([UserRole.MANAGER])
  async create(@RequestUser() user: User, @Body() body: CreateGroupDto) {
    return await this.groupService.create(user, body);
  }

  @Patch(':groupId')
  @Auth()
  async update(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Param('groupId') groupId: string,
    @Body() body: UpdateGroupDto,
  ) {
    const ref: GroupRef = { institutionId, groupId };
    return await this.groupService.update(user, ref, body);
  }

  @Patch('update/batch')
  @Auth()
  async batchUpdate(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Body() { groups }: BatchUpdateGroupsDto,
  ) {
    await this.groupService.batchUpdate(user, institutionId, groups);
    return {};
  }

  @Delete(':groupId')
  @Auth([UserRole.MANAGER])
  async delete(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Param('groupId') groupId: string,
  ) {
    const ref: GroupRef = { institutionId, groupId };
    await this.groupService.delete(user, ref);
  }

  @Patch(':groupId/member')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async addMember(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Param('groupId') groupId: string,
    @Body() { userId }: UserIdDto,
  ) {
    const ref: GroupRef = { institutionId, groupId };
    return await this.groupService.updateMembers(user, ref, {
      userId,
      add: true,
    });
  }

  @Delete(':groupId/member')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async removeMember(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Param('groupId') groupId: string,
    @Body() { userId }: UserIdDto,
  ) {
    const ref: GroupRef = { institutionId, groupId };
    return await this.groupService.updateMembers(user, ref, {
      userId,
      add: false,
    });
  }

  @Post(':groupId/cycle')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async addCycle(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Param('groupId') groupId: string,
    @Body() body: Cycle,
  ) {
    const ref: GroupRef = { institutionId, groupId };
    return await this.groupService.addCycle(user, ref, body);
  }

  @Delete(':groupId/cycle/:cycleId')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async removeCycle(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
  ) {
    const ref: GroupRef = { institutionId, groupId };
    return await this.groupService.removeCycle(user, ref, cycleId);
  }
}
