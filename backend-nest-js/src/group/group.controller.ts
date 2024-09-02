import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GroupService } from './group.service';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { User } from '../common/type/custom-claims.type';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from '../user/enum/user-role.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddCycleDto } from './dto/add-cycle.dto';
import { AddSubgroupDto } from './dto/add-subgroup.dto';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {
  }

  @Get(':id')
  @Auth()
  async findOneById(@RequestUser() user: User, @Param('id') id: string) {
    return await this.groupService.findOneByIdOrFail(user, id);
  }

  @Get(':id/cycle/:cycleId')
  @Auth()
  async findOneCycleById(
    @RequestUser() user: User,
    @Param('id') id: string,
    @Param('cycleId') cycleId: string,
  ) {
    if (cycleId === 'active')
      return await this.groupService.findActiveCycle(user, id);
    
    return await this.groupService.findOneCycleByIdOrFail(user, id, cycleId);
  }

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User) {
    return await this.groupService.findAll(user);
  }

  @Get('athlete/me')
  @Auth([UserRole.ATHLETE])
  async findAthleteGroups(@RequestUser() user: User) {
    return await this.groupService.findAthleteGroups(user);
  }

  @Get(':id/cycle')
  @Auth()
  async findAllCycles(@RequestUser() user: User, @Param('id') id: string) {
    return await this.groupService.findAllCycles(user, id);
  }

  @Post()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async createGroup(@RequestUser() user: User, @Body() data: CreateGroupDto) {
    return await this.groupService.createGroup(user, data);
  }

  @Post(':id/subgroup')
  @Auth()
  async addSubgroup(
    @RequestUser() user: User,
    @Param('id') id: string,
    @Body() data: AddSubgroupDto,
  ) {
    return await this.groupService.addSubgroup(user, { ...data, id });
  }

  @Post(':id/cycle')
  @Auth()
  async addCycle(
    @RequestUser() user: User,
    @Param('id') id: string,
    @Body() data: AddCycleDto,
  ) {
    return await this.groupService.addCycle(user, { ...data, id });
  }
}
