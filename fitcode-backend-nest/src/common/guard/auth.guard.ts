import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { SESSION_COOKIE_NAME } from '@src/common/constant/cookie.constant';
import { FirebaseService } from '@src/firebase/firebase.service';

import { User } from '../type/firebase-auth.type';
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
    if (!req.cookies) return false;

    const session = req.cookies[SESSION_COOKIE_NAME];
    if (!session) return false;

    const decoded = await this.firebase.auth.verifySessionCookie(session, true);
    req.user = await this.firebase.findUserById(decoded.uid);
    return true;
  }
}
