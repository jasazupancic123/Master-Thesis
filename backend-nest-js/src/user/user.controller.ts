import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from './enum/user-role.enum';
import { UpdateUserClaimsDto, UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { FilterUserDto } from './dto/filter-user.dto';
import type { User } from '../common/type/custom-claims.type';

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
  async update(@RequestUser() user: User, @Body() data: UpdateUserDto) {
    await this.userService.update(user.uid, data);
    return { id: user.uid };
  }

  @Patch('me/claims')
  @Auth()
  async updateMe(@RequestUser() user: User, @Body() data: UpdateUserClaimsDto) {
    await this.userService.updateClaims(user.uid, data);
    return { id: user.uid };
  }

  @Delete('me/profile')
  @Auth()
  async removeMe(@RequestUser() user: User) {
    await this.userService.remove(user.uid);
    return { id: user.uid };
  }

  @Get(':id')
  @Auth()
  async findOne(@Param('id') id: string) {
    return await this.userService.findOneById(id);
  }

  @Get()
  @Auth()
  async findAll(
    @RequestUser() user: User,
    @Query() query: FilterUserDto,
  ) {
    return await this.userService.findAll(user, query);
  }

  @Patch(':id/claims')
  @Auth([UserRole.ADMIN])
  async updateClaims(@Param('id') id: string, @Body() data: UpdateUserClaimsDto) {
    await this.userService.updateClaims(id, data);
    return { id };
  }

  @Delete(':id')
  @Auth([UserRole.ADMIN])
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { id };
  }
}
