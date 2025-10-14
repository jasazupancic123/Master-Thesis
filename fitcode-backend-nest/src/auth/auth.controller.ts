import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';

import { Auth } from '@src/common/decorator/auth.decorator';
import { RequestUser } from '@src/common/decorator/request-user.decorator';
import { User } from '@src/common/type/firebase-auth.type';

import { UpdateCustomClaimsDto } from './dto/custom-claims.dto';
import { FilterUserQueryDto } from './dto/filter-user-query.dto';
import { IdTokenDto } from './dto/login.dto';
import { RegisterAthleteDto } from './dto/register-athlete.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUser } from './entities/user.entity';
import { UserRole } from './enum/user-role.enum';
import { AuthService } from './service/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('session-login')
  async sessionLogin(
    @Body() { idToken }: IdTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser | null> {
    return await this.authService.sessionLogin(idToken, res);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout(res);
  }

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
  @Auth([UserRole.ADMIN, UserRole.MANAGER, UserRole.ATHLETE])
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
    return await this.authService.registerAthlete({
      ...body,
      role: UserRole.ATHLETE,
    });
  }
}
