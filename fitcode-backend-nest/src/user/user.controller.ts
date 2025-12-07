import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateUserDto } from '@src/auth/dto/create-user.dto';

import { UserRole } from '../auth/enum/user-role.enum';
import { Auth } from '../common/decorator/auth.decorator';
import { RequestUser } from '../common/decorator/request-user.decorator';
import type { FirebaseUser } from '../common/type/firebase-auth.type';
import { ImportUsersDto } from './dto/import-users.dto';
import { SaveFaceEmbeddingsDto } from './dto/save-face-embeddings.dto';
import { SaveWellnessDto } from './dto/save-wellness.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './service/user.service';
import { WellnessService } from './service/wellness.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly wellnessService: WellnessService,
  ) {}

  @Get('institution')
  @Auth([UserRole.MANAGER])
  async findAllByManager(@RequestUser() user: FirebaseUser) {
    return await this.userService.findAllByManager(user);
  }

  @Get()
  @Auth()
  async findMe(@RequestUser() user: FirebaseUser) {
    return await this.userService.findOneById(user.uid);
  }

  @Post('/import')
  @Auth([UserRole.MANAGER])
  async importProfiles(
    @RequestUser() user: FirebaseUser,
    @Body()
    { users: profiles }: ImportUsersDto,
  ) {
    return await this.userService.importUsers(user, profiles);
  }

  @Patch(':id')
  @Auth()
  async updateUser(
    @RequestUser() user: FirebaseUser,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    await this.userService.update(user, id, body);
  }

  @Post('register')
  @Auth([UserRole.ADMIN, UserRole.MANAGER])
  async registerUser(
    @RequestUser() user: FirebaseUser,
    @Body() body: CreateUserDto,
  ) {
    return await this.userService.register(user, body);
  }

  @Post('embed')
  @Auth([UserRole.ATHLETE])
  async saveFaceEmbeddings(
    @RequestUser() user: FirebaseUser,
    @Body() body: SaveFaceEmbeddingsDto,
  ) {
    return await this.userService.saveFaceEmbedding(user, body.faceEmbedding);
  }

  @Post('wellness')
  @Auth([UserRole.ATHLETE])
  async upsertWellness(
    @RequestUser() user: FirebaseUser,
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
