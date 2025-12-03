import { Body, Controller, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { Auth } from '@src/common/decorator/auth.decorator';
import { RequestUser } from '@src/common/decorator/request-user.decorator';
import { User } from '@src/common/type/firebase-auth.type';

import { VerifyMagicLinkDto } from './dto/create-magic-link.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { IdTokenDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUser } from './entity/user.entity';
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

  @Post('register')
  @Auth([UserRole.ADMIN, UserRole.MANAGER])
  async registerUser(@RequestUser() user: User, @Body() body: CreateUserDto) {
    return await this.authService.registerUser(user, body);
  }

  @Post('link/verify')
  async verifyLink(@Body() { token }: VerifyMagicLinkDto) {
    return await this.authService.verifyMagicLink(token);
  }
}
