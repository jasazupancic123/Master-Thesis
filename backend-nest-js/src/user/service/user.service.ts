import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { CreateUser, UserEntity } from '../entity/user.entity';
import { UpdateUserClaimsDto } from '../dto/update-user.dto';
import { User } from '../../common/type/firebase-auth.type';
import { UserRecord } from 'firebase-admin/lib/auth';
import { FilterUserQueryDto } from '../dto/filter-user-query.dto';
import { UserRepository } from '../repository/user.repository';
import { WellnessService } from './wellness.service';
import { UserRef } from '../../common/type/firebase-firestore.type';
import { CreateWellness } from '../type/wellness.type';
import { Wellness } from '../entity/wellness.entity';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userRepository: UserRepository,
    private readonly wellnessService: WellnessService,
  ) {}

  async findOne(id: string): Promise<UserEntity | null> {
    return await this.userRepository.getDoc(id);
  }

  async findOneOrFail(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async upsert(data: CreateUser): Promise<User> {
    const { auth } = this.firebaseService;
    const { email, password, displayName } = data;

    let user: UserRecord;
    try {
      user = await auth.getUserByEmail(email);
    } catch (e) {
      this.logger.log(`Creating user (${email}, ${JSON.stringify(data)})`);
      user = await auth.createUser({ email, password, displayName });
    }

    return (await auth.getUser(user.uid)) as User;
  }

  async findOneBy(key: 'id' | 'email', value: string): Promise<User> {
    switch (key) {
      case 'id':
        return (await this.firebaseService.auth.getUser(value)) as User;
      case 'email':
        return (await this.firebaseService.auth.getUserByEmail(value)) as User;
      default:
        throw new Error('Invalid key');
    }
  }

  async findAll(filter?: FilterUserQueryDto): Promise<User[]> {
    return await this.firebaseService.authUsers(filter);
  }

  async findAllOrFail(filter?: FilterUserQueryDto): Promise<User[]> {
    const users = await this.findAll(filter);
    if (filter) {
      const length = filter.ids?.length || 0 + filter.emails?.length || 0;
      if (users.length !== length)
        throw new BadRequestException('Some users not found');
    }

    return users;
  }

  async updateClaims(uid: string, claims: UpdateUserClaimsDto): Promise<void> {
    const customClaims = (await this.firebaseService.auth.getUser(uid))
      .customClaims;
    await this.firebaseService.auth.setCustomUserClaims(uid, {
      ...customClaims,
      ...claims,
    });
  }

  async submitWellness(
    ref: Required<UserRef>,
    data: CreateWellness,
  ): Promise<Wellness> {
    return await this.wellnessService.create(ref, data);
  }

  async findTodayWellness(ref: Required<UserRef>): Promise<Wellness | null> {
    return await this.wellnessService.findToday(ref);
  }
}
