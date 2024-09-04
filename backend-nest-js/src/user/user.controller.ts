import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from './enum/user-role.enum';
import { UpdateUserClaimsDto, UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { FilterUserDto } from './dto/filter-user.dto';
import type { User } from '../common/type/custom-claims.type';
import { CreateWellnessDto } from './dto/create-wellness.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {
  }

  @Get('me/profile')
  @Auth()
  async findMe(@RequestUser() user: User) {
    return await this.userService.findOneById(user.uid);
  }

  @Patch('me/profile')
  @Auth()
  async updateMe(@RequestUser() user: User, @Body() data: UpdateUserDto) {
    await this.userService.update(user.uid, data);
    return { id: user.uid };
  }

  @Post('me/wellness')
  @Auth([UserRole.ATHLETE])
  async createMyWellness(@RequestUser() user: User, @Body() data: CreateWellnessDto) {
    return await this.userService.createWellness(user, data);
  }

  @Get('me/wellness')
  @Auth([UserRole.ATHLETE])
  async findWellness(@RequestUser() user: User) {
    const wellness = await this.userService.findWellness(user);
    return wellness || {};
  }

  @Get(':id')
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async findOneById(@Param('id') id: string) {
    return await this.userService.findOneById(id);
  }

  @Get()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async findAll(@RequestUser() user: User, @Query() query: FilterUserDto) {
    return await this.userService.findAll(user, query);
  }

  @Patch(':id')
  @Auth([UserRole.ADMIN])
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserClaimsDto) {
    await this.userService.updateClaims(id, data);
    return { id };
  }
}
