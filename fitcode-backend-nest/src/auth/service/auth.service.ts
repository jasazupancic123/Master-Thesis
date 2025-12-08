import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { UserRecord } from 'firebase-admin/auth';
import * as jwt from 'jsonwebtoken';
import { v4 } from 'uuid';

import { SESSION_COOKIE_NAME } from '@src/common/constant/cookie.constant';
import { CommonService } from '@src/common/service/common.service';
import { FirebaseUser } from '@src/common/type/firebase-auth.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { User } from '@src/user/entity/user.entity';
import { UserService } from '@src/user/service/user.service';

import { CreateUserDto } from '../dto/create-user.dto';
import { AuthUser } from '../entity/auth-user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly common: CommonService,
    private readonly firebase: FirebaseService,
    @Inject(forwardRef(() => InstitutionService))
    private readonly institutionService: Wrapper<InstitutionService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  async sessionLogin(idToken: string, res: Response): Promise<User | null> {
    try {
      const user = await this.verify(idToken);

      const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
      const session = await this.firebase.auth.createSessionCookie(idToken, {
        expiresIn,
      });

      const isLive =
        this.common.env.isProduction() || this.common.env.isStaging();

      res.cookie(SESSION_COOKIE_NAME, session, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: isLive,
        sameSite: 'strict',
        domain: isLive ? '.blindoff.com' : undefined,
        path: '/',
      });

      const profile = await this.userService.findOneById(user.uid);
      if (!profile) throw new NotFoundException('User profile not found');

      return profile;
    } catch (e) {
      this.logger.error('Session login failed', e);
      return null;
    }
  }

  async logout(res: Response) {
    res.clearCookie(SESSION_COOKIE_NAME);
  }

  async createMagicLink(
    user: FirebaseUser,
    uid: string,
    redirectPath?: string,
  ): Promise<string> {
    const found = await this.findOneBy('id', uid);
    if (!found) throw new NotFoundException('User not found');

    // check that user belongs to same institution as requester
    const institutions = await this.institutionService.findAll(user);
    if (
      !institutions.some((institution) =>
        institution.members.some((member) => member.id === found.uid),
      )
    )
      throw new ForbiddenException('Cannot create link for this user');

    const jwtSecret = this.common.env.getKey('JWT_SECRET');
    const customToken = await this.firebase.auth.createCustomToken(found.uid);
    const payload: { token: string; redirect?: string } = {
      token: customToken,
      redirect: redirectPath,
    };

    const magicJwt = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
    return this.common.env.getFrontendUrl(`/auth/magic?token=${magicJwt}`);
  }

  // Returns firebase custom token
  async verifyMagicLink(
    token: string,
  ): Promise<{ token: string; redirect?: string }> {
    try {
      const jwtSecret = this.common.env.getKey('JWT_SECRET');
      return jwt.verify(token, jwtSecret) as {
        token: string;
        redirect?: string;
      };
    } catch {
      throw new BadRequestException('Link expired');
    }
  }

  async verify(idToken: string): Promise<AuthUser> {
    const decoded = await this.firebase.auth.verifyIdToken(idToken);
    const user = (await this.firebase.auth.getUser(
      decoded.uid,
    )) as unknown as AuthUser;

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneBy(
    key: 'id' | 'email',
    value: string,
  ): Promise<FirebaseUser | null> {
    try {
      switch (key) {
        case 'id':
          return (await this.firebase.auth.getUser(value)) as FirebaseUser;
        case 'email':
          return (await this.firebase.auth.getUserByEmail(
            value,
          )) as FirebaseUser;
        default:
          throw new Error('Invalid key');
      }
    } catch (_e) {
      return null;
    }
  }

  async upsert(data: CreateUserDto): Promise<FirebaseUser> {
    const { auth } = this.firebase;
    const { email, password, displayName, role, photoURL } = data;

    let user: UserRecord;
    try {
      user = await auth.getUserByEmail(email);
    } catch (_) {
      user = await auth.createUser({
        uid: v4(),
        email,
        password,
        displayName,
        photoURL,
      });
    } finally {
      if (user?.uid) await auth.setCustomUserClaims(user.uid, { role: [role] });
    }

    return user?.uid ? ((await auth.getUser(user.uid)) as FirebaseUser) : null;
  }
}
