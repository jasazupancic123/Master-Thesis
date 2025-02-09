import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GroupService } from './service/group.service';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from '../user/enum/user-role.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddCycleDto } from './dto/add-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return await this.groupService.findAll(user);
  }

  @Post()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async create(@RequestUser() user: User, @Body() body: CreateGroupDto) {
    return await this.groupService.create(user, body);
  }

  @Get(':groupId')
  @Auth()
  async findById(@RequestUser() user: User, @Param('groupId') groupId: string) {
    return await this.groupService.findByIdOrFail(user, { groupId });
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

  @Delete(':groupId')
  @Auth()
  async delete(@RequestUser() user: User, @Param('groupId') groupId: string) {
    await this.groupService.delete(user, { groupId });
    return {};
  }

  @Post(':groupId/cycle')
  @Auth()
  async addCycle(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
    @Body() body: AddCycleDto,
  ) {
    return await this.groupService.addCycle(user, { groupId }, body);
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
    return await this.groupService.updateCycle(user, ref, body);
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
    return {};
  }
}
