// auth.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { AuthService } from './auth.service';

@Injectable()
export class RefreshAuthTokenMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const idToken = req.cookies?.idToken;
    const refreshToken = req.cookies?.refreshToken;
    if (!idToken) return next(); // let routes handle unauthenticated if needed

    try {
      (req as any).user = await this.authService.verify(idToken);
      return next();
    } catch {
      // token invalid/expired → try to refresh via refresh token
      if (!refreshToken) return next();

      const refreshed = await this.authService.refresh(refreshToken, res);
      if (!refreshed) return next();

      // set rotated tokens and continue
      this.authService.setCredentialsCookies(
        refreshed.idToken,
        refreshed.refreshToken,
        res,
      );

      (req as any).user = await this.authService.verify(refreshed.idToken);
      return next();
    }
  }
}
