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
import { AddSubgroupDto } from './dto/add-subgroup.dto';
import { CycleService } from './service/cycle.service';
import { SubgroupService } from './service/subgroup.service';
import { UpdateSubgroupDto } from './dto/update-subgroup.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { DateFilterDto } from '../common/dto/date-filter.dto';
import { endOfDay, startOfDay } from 'date-fns';

@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly cycleService: CycleService,
    private readonly subgroupService: SubgroupService,
  ) {}

  @Get()
  @Auth()
  async findAllGroups(@RequestUser() user: User) {
    return await this.groupService.findAll({
      user,
      populate: ['subgroups'],
    });
  }

  @Post()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async createGroup(@RequestUser() user: User, @Body() body: CreateGroupDto) {
    return await this.groupService.create(user, { ...body, ownerId: user.uid });
  }

  @Get(':groupId')
  @Auth()
  async findGroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    const ref = { groupId };
    return await this.groupService.findOneOrFail(ref, {
      user,
      populate: ['members', 'availableMembersIds', 'cycles'],
    });
  }

  @Get(':groupId/availableMembers')
  @Auth()
  async findAvailableMembers(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Query() query: DateFilterDto,
  ) {
    const ref = { groupId };
    const date = query.from || new Date();
    return await this.groupService.findAvailableMembers(ref, date, { user });
  }

  @Patch(':groupId')
  @Auth()
  async updateGroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() body: UpdateGroupDto,
  ) {
    const ref = { groupId };
    return await this.groupService.update(ref, body, { user });
  }

  @Get(':groupId/cycle')
  @Auth()
  async findAllCycles(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    const ref = { groupId };
    return await this.cycleService.findAll(ref, { user });
  }

  @Post(':groupId/cycle')
  @Auth()
  async addCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() data: AddCycleDto,
  ) {
    const ref = { groupId };
    const group = await this.groupService.findOneOrFail(ref, { user });
    return await this.cycleService.create(
      ref,
      {
        ...data,
        groupId,
        ownerId: group.ownerId,
        membersIds: group.membersIds,
      },
      { user },
    );
  }

  @Get(':groupId/cycle/active')
  @Auth()
  async findActiveCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    const ref = { groupId };
    return await this.cycleService.findActiveCycleByGroup(ref, new Date(), {
      user,
    });
  }

  @Patch(':groupId/cycle/:cycleId')
  @Auth()
  async updateCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
    @Body() body: UpdateCycleDto,
  ) {
    const ref = { groupId, cycleId };
    return await this.cycleService.update(ref, body, { user });
  }

  @Delete(':groupId/cycle/:cycleId')
  @Auth()
  async deleteCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('cycleId') cycleId: string,
  ) {
    const ref = { groupId, cycleId };
    await this.cycleService.remove(ref, { user });
    return { message: 'Cycle deleted successfully' };
  }

  @Get(':groupId/subgroup')
  @Auth()
  async findAllSubgroups(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Query() query: DateFilterDto,
  ) {
    const ref = { groupId };
    return await this.subgroupService.findAll(ref, {
      user,
      filter: {
        groupId: { value: groupId },
        from: { op: '>=', value: query.from || startOfDay(new Date()) },
        to: { op: '<=', value: query.to || endOfDay(new Date()) },
      },
    });
  }

  @Post(':groupId/subgroup')
  @Auth()
  async addSubgroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() body: AddSubgroupDto,
  ) {
    const ref = { groupId };
    return await this.subgroupService.create(ref, body, { user });
  }

  @Patch(':groupId/subgroup/:subgroupId')
  @Auth()
  async updateSubgroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('subgroupId') subgroupId: string,
    @Body() body: UpdateSubgroupDto,
  ) {
    const ref = { groupId, subgroupId };
    return await this.subgroupService.update(ref, body, { user });
  }

  @Delete(':groupId/subgroup/:subgroupId')
  @Auth()
  async deleteSubgroup(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Param('subgroupId') subgroupId: string,
  ) {
    const ref = { groupId, subgroupId };
    await this.subgroupService.remove(ref, { user });
    return { id: subgroupId };
  }
}
