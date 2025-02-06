import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GroupService } from './service/group.service';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from '../user/enum/user-role.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddCycleDto } from './dto/add-cycle.dto';
import { AddSubgroupDto } from '../training/dto/add-subgroup.dto';
import { UpdateSubgroupDto } from '../training/dto/update-subgroup.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { DateFilterDto } from '../common/dto/date-filter.dto';
import { endOfDay, startOfDay } from 'date-fns';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @Auth()
  async findAllGroups(@RequestUser() user: User) {
    return await this.groupService.findAll(user);
  }

  @Post()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async createGroup(@RequestUser() user: User, @Body() body: CreateGroupDto) {
    return await this.groupService.create(user, body);
  }

  @Get(':groupId')
  @Auth()
  async findGroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    return await this.groupService.findOneOrFail(user, { groupId });
  }

  @Patch(':groupId')
  @Auth()
  async updateGroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() body: UpdateGroupDto,
  ) {
    return await this.groupService.update(user, { groupId }, body);
  }

  @Post(':groupId/cycle')
  @Auth()
  async addCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() input: AddCycleDto,
  ) {
    return await this.groupService.addCycle(user, { groupId }, input);
  }

  @Patch(':groupId/cycle/:cycleId')
  @Auth()
  async updateCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Body() input: UpdateCycleDto,
  ) {
    const ref = { groupId, cycleId };
    return await this.groupService.updateCycle(user, ref, input);
  }

  @Delete(':groupId/cycle/:cycleId')
  @Auth()
  async deleteCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
  ) {
    const ref = { groupId, cycleId };
    await this.groupService.deleteCycle(ref, user);
    return { id: cycleId };
  }
}
