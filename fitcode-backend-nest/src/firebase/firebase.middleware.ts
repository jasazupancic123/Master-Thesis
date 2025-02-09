import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
  Scope,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { FirebaseService } from './firebase.service';
import { User } from '../common/type/firebase-auth.type';

@Injectable({ scope: Scope.DEFAULT })
export class FirebaseMiddleware implements NestMiddleware {
  constructor(private readonly firebaseService: FirebaseService) {}

  async use(req: Request, _: Response, next: NextFunction): Promise<void> {
    const { authorization } = req.headers;
    if (!authorization)
      throw new HttpException(
        'Missing authorization header',
        HttpStatus.UNAUTHORIZED,
      );

    const token = authorization.slice(7);
    const decodedToken = await this.firebaseService.auth.verifyIdToken(token);
    req.user = await this.firebaseService.findUserById(decodedToken.uid);
    next();
  }
}

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}
