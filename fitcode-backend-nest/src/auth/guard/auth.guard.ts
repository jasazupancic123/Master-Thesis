import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { SESSION_COOKIE_NAME } from '@src/common/constant/cookie.constant';
import { User } from '@src/common/type/firebase-auth.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { AUTH_ROLES_KEY } from './role.guard';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly firebase: FirebaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      AUTH_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) return true;

    const req = context.switchToHttp().getRequest<Request & { user: User }>();

    // 1) Try Bearer token (ID token authentication)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = await this.firebase.auth.verifyIdToken(token, false);
        req.user = await this.firebase.findUserById(decoded.uid);
        return true;
      } catch {
        // fall through to cookie auth
      }
    }

    // 2) Try Session cookie authentication
    const session = req.cookies?.[SESSION_COOKIE_NAME];
    if (session) {
      try {
        const decoded = await this.firebase.auth.verifySessionCookie(
          session,
          true, // check revoked for sessions
        );

        req.user = await this.firebase.findUserById(decoded.uid);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}
