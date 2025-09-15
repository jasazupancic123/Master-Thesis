import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRecord } from 'firebase-admin/auth';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { User } from '@src/common/type/firebase-auth.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';

import { CreateUser } from './dto/create-user.dto';
import { UpdateCustomClaimsDto } from './dto/custom-claims.dto';
import { FilterUserQueryDto } from './dto/filter-user-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => InstitutionService))
    private readonly institutionService: Wrapper<InstitutionService>,
  ) {}

  async findOneBy(key: 'id' | 'email', value: string): Promise<User | null> {
    try {
      switch (key) {
        case 'id':
          return (await this.firebaseService.auth.getUser(value)) as User;
        case 'email':
          return (await this.firebaseService.auth.getUserByEmail(
            value,
          )) as User;
        default:
          throw new Error('Invalid key');
      }
    } catch (_e) {
      return null;
    }
  }

  async findAll(user: User, filter?: FilterUserQueryDto): Promise<User[]> {
    const institutions = await this.institutionService.findAll(user);
    const allUsers = await this.firebaseService.authUsers(filter);

    if (this.firebaseService.isAdmin(user)) return allUsers;

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
        users = users.filter((u) =>
          this.firebaseService.checkRole(u, filter.role),
        );
    }

    return users;
  }

  async updateUser(user: User, uid: string, data: UpdateUserDto) {
    const userToUpdate = await this.getUserToUpdate(user, uid);
    await this.firebaseService.auth.updateUser(userToUpdate.uid, data);
  }

  async updateCustomClaims(
    user: User,
    uid: string,
    claims: UpdateCustomClaimsDto,
  ): Promise<void> {
    const userToUpdate = await this.getUserToUpdate(user, uid);
    await this.firebaseService.auth.setCustomUserClaims(userToUpdate.uid, {
      ...userToUpdate.customClaims,
      ...claims,
    });
  }

  async upsert(data: CreateUser): Promise<User> {
    const { auth } = this.firebaseService;
    const { email, password, displayName, customClaims /* institutionId */ } =
      data;

    let user: UserRecord;
    try {
      user = await auth.getUserByEmail(email);
    } catch (_) {
      this.logger.log(`Creating user (${email}, ${JSON.stringify(data)})`);
      user = await auth.createUser({ email, password, displayName });
    } finally {
      if (user?.uid) await auth.setCustomUserClaims(user.uid, customClaims);
    }

    return user?.uid ? ((await auth.getUser(user.uid)) as User) : null;
  }

  @LogMethod()
  async registerAthlete(input: Omit<CreateUser, 'customClaims'>) {
    const { email, displayName, password } = input;
    return await this.firebaseService.auth.createUser({
      email,
      displayName,
      password,
    });
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
    if (this.firebaseService.isAdmin(mainUser)) return true;

    // athlete can update only himself
    if (
      this.firebaseService.isAthlete(userToUpdate) &&
      mainUser.uid === userToUpdate.uid
    )
      return true;

    // manager can update himself, trainers and athletes in his institutions
    // trainer can update himself and athletes in his institutions
    const institutions = await this.institutionService.findAll(mainUser);

    if (this.firebaseService.isManager(mainUser)) {
      const institution = institutions.find((i) => i.ownerId === mainUser.uid);
      if (!institution) return false;

      if (
        this.firebaseService.isTrainer(userToUpdate) &&
        institution.trainerIds.includes(userToUpdate.uid)
      )
        return true;

      if (
        this.firebaseService.isAthlete(userToUpdate) &&
        institution.athleteIds.includes(userToUpdate.uid)
      )
        return true;

      return mainUser.uid === userToUpdate.uid;
    }

    if (this.firebaseService.isTrainer(mainUser)) {
      const trainerInstitutions = institutions.filter((i) =>
        i.trainerIds.includes(mainUser.uid),
      );

      if (
        this.firebaseService.isAthlete(userToUpdate) &&
        trainerInstitutions.some((i) => i.athleteIds.includes(userToUpdate.uid))
      )
        return true;

      return mainUser.uid === userToUpdate.uid;
    }

    return false;
  }
}
