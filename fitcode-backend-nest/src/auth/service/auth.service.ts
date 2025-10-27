import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { UserRecord } from 'firebase-admin/auth';
import { v4 } from 'uuid';

import { SESSION_COOKIE_NAME } from '@src/common/constant/cookie.constant';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { CommonService } from '@src/common/service/common.service';
import { CustomClaims, User } from '@src/common/type/firebase-auth.type';
import { ValidateRowError } from '@src/common/type/validate.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionService } from '@src/institution/service/institution.service';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateCustomClaimsDto } from '../dto/custom-claims.dto';
import { FilterUserQueryDto } from '../dto/filter-user-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthUser } from '../entity/user.entity';
import { UserRole } from '../enum/user-role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly common: CommonService,
    private readonly firebase: FirebaseService,
    @Inject(forwardRef(() => InstitutionService))
    private readonly institutionService: Wrapper<InstitutionService>,
  ) {}

  async sessionLogin(idToken: string, res: Response): Promise<AuthUser | null> {
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

      return user;
    } catch (e) {
      this.logger.error('Session login failed', e);
      return null;
    }
  }

  async logout(res: Response) {
    res.clearCookie(SESSION_COOKIE_NAME);
  }

  async verify(idToken: string): Promise<AuthUser> {
    const decoded = await this.firebase.auth.verifyIdToken(idToken);
    const user = (await this.firebase.auth.getUser(
      decoded.uid,
    )) as unknown as AuthUser;

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneBy(key: 'id' | 'email', value: string): Promise<User | null> {
    try {
      switch (key) {
        case 'id':
          return (await this.firebase.auth.getUser(value)) as User;
        case 'email':
          return (await this.firebase.auth.getUserByEmail(value)) as User;
        default:
          throw new Error('Invalid key');
      }
    } catch (_e) {
      return null;
    }
  }

  async findAll(user: User, filter?: FilterUserQueryDto): Promise<User[]> {
    const allUsers = await this.firebase.authUsers(filter);
    if (this.firebase.isAdmin(user)) return allUsers;

    const institutions = await this.institutionService.findAll(user);
    const users = allUsers.filter((u) =>
      institutions.some((institution) =>
        [
          ...institution.trainerIds,
          ...institution.athleteIds,
          institution.ownerId,
        ].includes(u.uid),
      ),
    );

    // some users can be in multiple institutions, so we need to filter out duplicates
    const uniqueUsers = users.filter(
      (u, index, self) => index === self.findIndex((t) => t.uid === u.uid),
    );

    if (filter?.ids?.length === 0 || filter?.emails?.length === 0) return [];
    return uniqueUsers;
  }

  async findAllOrFail(
    user: User,
    filter?: FilterUserQueryDto,
  ): Promise<User[]> {
    let users = await this.findAll(user, filter);
    if (filter) {
      /* const length = filter.ids?.length || 0 + filter.emails?.length || 0;
        if (users.length !== length)
          throw new BadRequestException('Invalid members provided'); */

      if (filter.role)
        users = users.filter((u) => this.firebase.checkRole(u, filter.role));
    }

    return users;
  }

  async updateUser(user: User, uid: string, data: UpdateUserDto) {
    const userToUpdate = await this.getUserToUpdate(user, uid);
    await this.firebase.auth.updateUser(userToUpdate.uid, data);
  }

  async updateCustomClaims(
    user: User,
    uid: string,
    claims: UpdateCustomClaimsDto,
  ): Promise<void> {
    // if user is manager, he can only assign trainer or athlete role
    if (this.firebase.isManager(user)) {
      const newRole = claims.role?.[0];
      if (![UserRole.TRAINER, UserRole.ATHLETE].includes(newRole))
        throw new ForbiddenException('Cannot assign this role');
    }

    const userToUpdate = await this.getUserToUpdate(user, uid);
    await this.firebase.auth.setCustomUserClaims(userToUpdate.uid, {
      ...userToUpdate.customClaims,
      ...claims,
    });
  }

  async upsert(data: CreateUserDto): Promise<User> {
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

    return user?.uid ? ((await auth.getUser(user.uid)) as User) : null;
  }

  /**
   * Import users from a CSV file. It returns the list of successfully created users
   * and the list of errors for the rows that failed to be created.
   */
  async importUsers(
    user: User,
    input: (CreateUserDto & { uid: string })[],
  ): Promise<{ successful: AuthUser[]; errors: ValidateRowError[] }> {
    if (input.length === 0) return { successful: [], errors: [] };
    const errors: ValidateRowError[] = [];
    const result: AuthUser[] = [];

    for (let i = 0; i < input.length; i++) {
      const row: ValidateRowError = { row: i + 1, errors: [] };

      try {
        const created = await this.registerUser(user, input[i]);
        result.push({ ...created, customClaims: { role: [input[i].role] } });
      } catch (e) {
        row.errors.push({ field: input[i].email, message: e.message });
      }

      if (row.errors.length > 0) errors.push(row);
    }

    return { successful: result, errors };
  }

  @LogMethod()
  async registerUser(user: User, input: CreateUserDto) {
    // admin can register managers, and managers can register trainers and athletes
    let institution: Institution | null = null;
    if (this.firebase.isAdmin(user)) {
      if (input.role !== UserRole.MANAGER)
        throw new BadRequestException('Admin can only register managers');
    } else if (this.firebase.isManager(user)) {
      if (![UserRole.TRAINER, UserRole.ATHLETE].includes(input.role))
        throw new BadRequestException(
          'Manager can only register trainers and athletes',
        );

      institution = await this.institutionService.findByOwnerId(user.uid);
      if (!institution)
        throw new NotFoundException('Institution not found for manager');
    } else throw new ForbiddenException('Cannot register user');

    let created: AuthUser | null = null;

    try {
      const user = await this.firebase.auth.createUser(input);
      const customClaims: CustomClaims = { role: [input.role] };
      await this.firebase.auth.setCustomUserClaims(user.uid, customClaims);
      created = { ...user, customClaims } as AuthUser;
    } catch (e) {
      // if user already exists, fetch it
      if (e.code === 'auth/email-already-exists')
        created = await this.findOneBy('email', input.email);
      else throw e;
    }

    if (!created) throw new BadRequestException('User could not be created');

    // add user to institution
    if (institution)
      switch (input.role) {
        case UserRole.TRAINER:
          if (institution.trainerIds.includes(created.uid))
            throw new ConflictException('Trainer already in institution');

          await this.institutionService.addTrainer(institution.id, created.uid);
          break;
        case UserRole.ATHLETE:
          if (institution.athleteIds.includes(created.uid))
            throw new ConflictException('Athlete already in institution');

          await this.institutionService.addAthlete(institution.id, created.uid);
          break;
        default:
          throw new BadRequestException('Invalid role for institution user');
      }

    return created;
  }

  async getUserToUpdate(mainUser: User, userToUpdateId: string): Promise<User> {
    const userToUpdate = await this.findOneBy('id', userToUpdateId);
    if (!userToUpdate) throw new NotFoundException('User not found');

    const canUpdate = await this.canUpdate(mainUser, userToUpdate);
    if (!canUpdate) throw new ForbiddenException('Cannot update user');

    return userToUpdate;
  }

  async canUpdate(mainUser: User, userToUpdate: User): Promise<boolean> {
    // admin can update anyone
    if (this.firebase.isAdmin(mainUser)) return true;

    // athlete can update only himself
    if (
      this.firebase.isAthlete(userToUpdate) &&
      mainUser.uid === userToUpdate.uid
    )
      return true;

    // manager can update himself, trainers and athletes in his institutions
    // trainer can update himself and athletes in his institutions
    const institutions = await this.institutionService.findAll(mainUser);

    if (this.firebase.isManager(mainUser)) {
      const institution = institutions.find((i) => i.ownerId === mainUser.uid);
      if (!institution) return false;

      if (
        this.firebase.isTrainer(userToUpdate) &&
        institution.trainerIds.includes(userToUpdate.uid)
      )
        return true;

      if (
        this.firebase.isAthlete(userToUpdate) &&
        institution.athleteIds.includes(userToUpdate.uid)
      )
        return true;

      return mainUser.uid === userToUpdate.uid;
    }

    if (this.firebase.isTrainer(mainUser)) {
      const trainerInstitutions = institutions.filter((i) =>
        i.trainerIds.includes(mainUser.uid),
      );

      if (
        this.firebase.isAthlete(userToUpdate) &&
        trainerInstitutions.some((i) => i.athleteIds.includes(userToUpdate.uid))
      )
        return true;

      return mainUser.uid === userToUpdate.uid;
    }

    return false;
  }
}
