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
import { Bodyweight } from '../entity/body-weight.entity';

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
    const { email, password, displayName, customClaims } = data;

    let user: UserRecord;
    try {
      user = await auth.getUserByEmail(email);
    } catch (e) {
      this.logger.log(`Creating user (${email}, ${JSON.stringify(data)})`);
      user = await auth.createUser({ email, password, displayName });
    } finally {
      await auth.setCustomUserClaims(user.uid, customClaims);
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
    if (filter?.ids?.length === 0 || filter?.emails?.length === 0) return [];
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

  async addGroup(userId: string, groupId: string): Promise<void> {
    await this.userRepository.addGroup(userId, groupId);
  }

  async removeGroup(userId: string, groupId: string): Promise<void> {
    await this.userRepository.removeGroup(userId, groupId);
  }

  async addWellness(
    ref: Required<UserRef>,
    data: CreateWellness,
  ): Promise<Wellness> {
    return await this.wellnessService.create(ref, data);
  }

  async addBodyweight(ref: Required<UserRef>, weight: number): Promise<void> {
    await this.userRepository.updateDoc(ref.uid, { weight });
  }

  async getBodyweight(user: User | string): Promise<number> {
    return await this.userRepository.getBodyweight(
      typeof user === 'string' ? user : user.uid,
    );
  }

  async findTodayWellness(ref: Required<UserRef>): Promise<Wellness | null> {
    return await this.wellnessService.findToday(ref);
  }

  async findWellnessHistory(
    ref: Required<UserRef>,
    n = 7,
  ): Promise<Wellness[]> {
    return await this.wellnessService.findLastNDays(ref, n);
  }

  async findBodyweightHistory(
    ref: Required<UserRef>,
    n = 7,
  ): Promise<Bodyweight[]> {
    const { bodyweight } = await this.userRepository.getDoc(ref.uid);
    const sorted = bodyweight.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    return sorted.slice(0, n);
  }
}
