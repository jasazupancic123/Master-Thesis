import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/firebase-auth.type';
import { UserRole } from '../user/enum/user-role.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './group.service';

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
    return await this.groupService.findByIdOrFail(user, { groupId });
  }

  @Post()
  @Auth()
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

  @Delete(':groupId')
  @Auth()
  async delete(@RequestUser() user: User, @Param('groupId') groupId: string) {
    await this.groupService.delete(user, { groupId });
    return {};
  }
}
