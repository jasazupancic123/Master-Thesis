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
import { RegisterAthleteDto } from './dto/add-athlete.dto';
import { UpdateCustomClaimsDto } from './dto/custom-claims.dto';
import { FilterUserQueryDto } from './dto/filter-user-query.dto';
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
  async updateClaims(
    @Param('id') id: string,
    @Body() body: UpdateCustomClaimsDto,
  ) {
    await this.authService.updateCustomClaims(id, body);
    return {};
  }

  @Post('athlete/add')
  @Auth([UserRole.TRAINER])
  async registerAthlete(
    @RequestUser() user: User,
    @Body() body: RegisterAthleteDto,
  ) {
    return await this.authService.registerAthlete(user, body);
  }
}
