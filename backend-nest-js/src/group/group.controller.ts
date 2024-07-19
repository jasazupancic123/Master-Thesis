import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GroupService } from './group.service';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { CustomClaims } from '../common/type/custom-claims.type';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from '../user/enum/user-role.enum';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: CustomClaims) {
    return await this.groupService.findAll(user);
  }

  @Get(':id')
  @Auth()
  async findOneById(
    @RequestUser() user: CustomClaims,
    @Param('id') id: string,
  ) {
    return await this.groupService.findOneById(user, id);
  }

  @Post()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async create(
    @RequestUser() user: CustomClaims,
    @Body() data: CreateGroupDto,
  ) {
    return await this.groupService.create(user, data);
  }
}
