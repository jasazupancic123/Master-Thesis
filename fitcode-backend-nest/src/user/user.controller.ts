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
import { SaveUserMetaDto } from './dto/save-user-meta.dto';
import { UpdateUserClaimsDto } from './dto/update-user.dto';
import { UserRole } from './enum/user-role.enum';
import { UserService } from './service/user.service';

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
    @Body() data: UpdateUserClaimsDto,
  ) {
    await this.userService.updateClaims(id, data);
    return {};
  }

  @Get('me/meta')
  @Auth([UserRole.ATHLETE])
  async getMyMeta(@RequestUser() user: User) {
    const ref = { uid: user.uid };
    return await this.userService.getLastMeta(ref);
  }

  @Post('me/meta')
  @Auth([UserRole.ATHLETE])
  async saveMeta(@RequestUser() user: User, @Body() input: SaveUserMetaDto) {
    const ref = { uid: user.uid, date: new Date() };
    return await this.userService.addOrUpdateMeta(ref, {
      ...input,
      userId: user.uid,
      date: ref.date,
    });
  }

  @Post('athlete/add')
  @Auth([UserRole.TRAINER])
  async addAthlete(@Body() body: AddAthleteDto) {
    return await this.userService.addAthlete(body);
  }
}
