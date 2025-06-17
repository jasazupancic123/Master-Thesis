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
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto, UpdateGroupDtoWithId } from './dto/update-group.dto';
import { GroupService } from './group.service';
import { UserRole } from '../user/enum/user-role.enum';

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

  @Get(':groupId/members')
  @Auth()
  async findMembers(
    @RequestUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    return await this.groupService.findMembers(user, { groupId });
  }

  @Get('institution/:institutionId')
  @Auth([UserRole.MANAGER, UserRole.TRAINER, UserRole.ADMIN])
  async findAllByInstitution(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
  ) {
    return await this.groupService.findAllByInstitution(user, {
      institutionId,
    });
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

  @Patch('/batch')
  @Auth()
  async updateMultiple(
    @RequestUser() user: User,
    @Body() body: UpdateGroupDtoWithId[],
  ) {
    return await this.groupService.updateMultiple(user, body);
  }

  @Delete(':groupId')
  @Auth()
  async delete(@RequestUser() user: User, @Param('groupId') groupId: string) {
    await this.groupService.delete(user, { groupId });
    return {};
  }
}
