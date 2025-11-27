import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserRole } from '../auth/enum/user-role.enum';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import type { User } from '../common/type/firebase-auth.type';
import { ImportProfilesDto } from './dto/import-profiles.dto';
import { SaveWellnessDto } from './dto/save-wellness.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './service/profile.service';
import { WellnessService } from './service/wellness.service';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly wellnessService: WellnessService,
  ) {}

  @Get('institution')
  @Auth([UserRole.MANAGER])
  async findAllByManager(@RequestUser() user: User) {
    return await this.profileService.findAllByManager(user);
  }

  @Get()
  @Auth()
  async findProfile(@RequestUser() user: User) {
    return await this.profileService.findOneById(user.uid);
  }

  @Post('/import')
  @Auth([UserRole.MANAGER])
  async importProfiles(
    @RequestUser() user: User,
    @Body()
    { profiles }: ImportProfilesDto,
  ) {
    return await this.profileService.importProfiles(user, profiles);
  }

  @Patch()
  @Auth()
  async update(@RequestUser() user: User, @Body() body: UpdateProfileDto) {
    await this.profileService.updateProfile(user, body);
    return {};
  }

  @Post()
  @Auth([UserRole.ATHLETE])
  async upsertWellness(
    @RequestUser() user: User,
    @Body() body: SaveWellnessDto,
  ) {
    const ref = { uid: user.uid, date: new Date() };
    return await this.wellnessService.upsert(ref, {
      ...body,
      userId: user.uid,
      date: ref.date,
    });
  }
}
