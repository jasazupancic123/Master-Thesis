import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Auth } from '@src/common/decorator/auth.decorator';
import { RequestUser } from '@src/common/decorator/request-user.decorator';
import { User } from '@src/common/type/firebase-auth.type';

import { AuthService } from './auth.service';
import { UpdateCustomClaimsDto } from './dto/custom-claims.dto';
import { FilterUserQueryDto } from './dto/filter-user-query.dto';
import { RegisterAthleteDto } from './dto/register-athlete.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enum/user-role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @Auth()
  async findAll(@RequestUser() user: User, @Query() query: FilterUserQueryDto) {
    return await this.authService.findAll(user, query);
  }

  @Get(':id')
  @Auth()
  async findById(@RequestUser() user: User, @Param('id') id: string) {
    if (id === 'me') return await this.authService.findOneBy('id', user.uid);
    return await this.authService.findOneBy('id', id);
  }

  @Patch(':id')
  @Auth()
  async updateUser(
    @RequestUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    await this.authService.updateUser(user, id, body);
  }

  @Patch(':id/claims')
  @Auth()
  async updateCustomClaims(
    @RequestUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateCustomClaimsDto,
  ) {
    await this.authService.updateCustomClaims(user, id, body);
  }

  @Post('athlete/register')
  @Auth([UserRole.TRAINER, UserRole.MANAGER])
  async registerAthlete(
    @RequestUser() user: User,
    @Body() body: RegisterAthleteDto,
  ) {
    return await this.authService.registerAthlete(body);
  }
}
