import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { VerifyMagicLinkDto } from './dto/create-magic-link.dto';
import { IdTokenDto } from './dto/login.dto';
import { AuthUser } from './entity/auth-user.entity';
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

  @Post('link/verify')
  async verifyLink(@Body() { token }: VerifyMagicLinkDto) {
    return await this.authService.verifyMagicLink(token);
  }
}
