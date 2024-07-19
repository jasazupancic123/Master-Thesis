import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Reflector } from '@nestjs/core';
import { CustomClaims } from '../type/custom-claims.type';
import { AUTH_ROLES_KEY } from './role.guard';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly firebaseService: FirebaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(AUTH_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const { authorization } = context.switchToHttp().getRequest().headers;
    if (!authorization) return false;

    try {
      const token = authorization.slice(7);
      context.switchToHttp().getRequest().user = await this.firebaseService.auth.verifyIdToken(token) as CustomClaims;
      return true;
    } catch (e) {
      return false;
    }
  }
}