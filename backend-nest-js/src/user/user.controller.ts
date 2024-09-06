import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { RequestUser } from '../common/decorator/request-user.decorator';
import { Auth } from '../common/decorator/auth.decorator';
import { UserRole } from './enum/user-role.enum';
import { UpdateUserClaimsDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { FilterUserQueryDto } from './dto/filter-user-query.dto';
import type { User } from '../common/type/firebase-auth.type';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {
  }

  @Get()
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async findAll(@Query() query: FilterUserQueryDto) {
    return await this.userService.findAll(query);
  }

  @Get(':id')
  @Auth([UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN])
  async findOneById(@RequestUser() user: User, @Param('id') id: string) {
    if (id === 'me')
      return await this.userService.findOneBy('id', user.uid);

    return await this.userService.findOneBy('id', id);
  }

  @Patch(':id')
  @Auth([UserRole.ADMIN])
  async updateUserClaims(@Param('id') id: string, @Body() data: UpdateUserClaimsDto) {
    await this.userService.updateClaims(id, data);
    return { id };
  }
}
