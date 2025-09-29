import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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

  @Post('/import')
  @Auth([UserRole.MANAGER])
  async importProfiles(
    @Body()
    { profiles }: ImportProfilesDto,
  ) {
    return await this.profileService.importProfiles(profiles);
  }

  @Get()
  @Auth()
  async findProfile(@RequestUser() user: User) {
    const ref = { uid: user.uid };
    return await this.profileService.findOneById(ref.uid);
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

  @Get('/wellness')
  @Auth([UserRole.ATHLETE])
  async getLatestWellnessByUser(@RequestUser() user: User) {
    const ref = { uid: user.uid };
    return (
      (await this.wellnessService.getLatestByUser(ref)) || {
        date: new Date(),
        userId: user.uid,
      }
    );
  }

  @Get('/wellness/institution/:institutionId')
  @Auth([UserRole.MANAGER, UserRole.TRAINER])
  async getWellnessByInstitution(
    @RequestUser() user: User,
    @Param('institutionId') institutionId: string,
  ) {
    return await this.wellnessService.findAllByInstitution(user, {
      institutionId,
    });
  }
}
