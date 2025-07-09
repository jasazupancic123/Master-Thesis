import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import type { User } from '../common/type/firebase-auth.type';
import { AddAthleteDto } from './dto/add-athlete.dto';
import { FilterUserQueryDto } from './dto/filter-user-query.dto';
import { SaveUserWellnessDto } from './dto/save-user-wellness.dto';
import { UpdateUserClaimsDto } from './dto/update-user-claims.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserRole } from './enum/user-role.enum';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth()
  async findAll(@Query() query: FilterUserQueryDto) {
    return await this.userService.findAll(query);
  }

  @Get(':id')
  @Auth()
  async findById(@RequestUser() user: User, @Param('id') id: string) {
    if (id === 'me') return await this.userService.findOneBy('id', user.uid);
    return await this.userService.findOneBy('id', id);
  }

  @Patch(':id')
  @Auth([UserRole.ADMIN])
  async updateClaims(
    @Param('id') id: string,
    @Body() body: UpdateUserClaimsDto,
  ) {
    await this.userService.updateClaims(id, body);
    return {};
  }

  @Get('me/profile')
  @Auth()
  async findProfile(@RequestUser() user: User) {
    const ref = { uid: user.uid };
    return await this.userService.findProfile(ref);
  }

  @Patch('me/profile')
  @Auth()
  async updateProfile(
    @RequestUser() user: User,
    @Body() body: UpdateUserProfileDto,
  ) {
    const ref = { uid: user.uid };
    await this.userService.updateProfile(ref, body);
    return {};
  }

  @Get('me/meta')
  @Auth([UserRole.ATHLETE])
  async getMyMeta(@RequestUser() user: User) {
    const ref = { uid: user.uid };
    return (
      (await this.userService.getRecentWellness(ref)) || {
        date: new Date(),
        userId: user.uid,
      }
    );
  }

  @Post('me/meta')
  @Auth([UserRole.ATHLETE])
  async saveMeta(@RequestUser() user: User, @Body() body: SaveUserWellnessDto) {
    const ref = { uid: user.uid, date: new Date() };
    return await this.userService.addOrUpdateWellness(ref, {
      ...body,
      userId: user.uid,
      date: ref.date,
    });
  }

  @Post('athlete/add')
  @Auth([UserRole.TRAINER])
  async addAthlete(@RequestUser() user: User, @Body() body: AddAthleteDto) {
    return await this.userService.addAthlete(user, body);
  }
}
