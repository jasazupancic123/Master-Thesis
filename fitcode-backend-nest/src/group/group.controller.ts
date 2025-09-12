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

import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { UserRole } from '../user/enum/user-role.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { BatchUpdateGroupsDto, UpdateGroupDto } from './dto/update-group.dto';
import { Cycle } from './entity/cycle.entity';
import { GroupService } from './group.service';

@ApiTags('Group')
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return await this.groupService.findAll(user);
  }

  @Get(':groupId')
  @Auth()
  async findById(@RequestUser() user: User, @Param('groupId') groupId: string) {
    return await this.groupService.findOneByIdOrFail(user, { groupId });
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
    @Param('groupId') groupId: string,
    @Body() body: UpdateGroupDto,
  ) {
    return await this.groupService.update(user, { groupId }, body);
  }

  @Patch('update/batch')
  @Auth()
  async batchUpdate(
    @RequestUser() user: User,
    @Body() { groups }: BatchUpdateGroupsDto,
  ) {
    await this.groupService.batchUpdate(user, groups);
    return {};
  }

  @Delete(':groupId')
  @Auth([UserRole.MANAGER])
  async delete(@RequestUser() user: User, @Param('groupId') groupId: string) {
    await this.groupService.delete(user, { groupId });
  }

  @Patch(':groupId/member')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async addMember(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return await this.groupService.updateMembers(
      user,
      { groupId },
      { userId, add: true },
    );
  }

  @Delete(':groupId/member')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async removeMember(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() { userId }: UserIdDto,
  ) {
    return await this.groupService.updateMembers(
      user,
      { groupId },
      { userId, add: false },
    );
  }

  @Post(':groupId/cycle')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async addCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() body: Cycle,
  ) {
    return await this.groupService.addCycle(user, { groupId }, body);
  }

  @Delete(':groupId/cycle/:cycleId')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async removeCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return await this.groupService.removeCycle(user, { groupId }, cycleId);
  }
}
