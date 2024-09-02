import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Reflector } from '@nestjs/core';
import { AUTH_ROLES_KEY } from './role.guard';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly firebaseService: FirebaseService,
  ) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(AUTH_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const { authorization } = context.switchToHttp().getRequest().headers;
    if (!authorization) return false;

    const token = authorization.slice(7);
    const verified = await this.firebaseService.auth.verifyIdToken(token);
    context.switchToHttp().getRequest().user = await this.firebaseService.findUserById(verified.uid);
    return true;
  }
}