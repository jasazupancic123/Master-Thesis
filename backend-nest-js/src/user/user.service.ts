import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUser } from './dto/user.dto';
import { UpdateUserClaimsDto } from './dto/update-user.dto';
import { User } from '../common/type/firebase-auth.type';
import { UserRecord } from 'firebase-admin/lib/auth';
import { Filter } from '../common/type/orm.type';
import { Wellness } from './entity/wellness.entity';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { Timestamp } from 'firebase-admin/firestore';
import dayjs from 'dayjs';
import { FilterUserQueryDto } from './dto/filter-user-query.dto';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    @InjectRepository(Wellness)
    private readonly wellnessRepository: FirestoreRepository<Wellness>,
  ) {
  }

  async upsert(data: CreateUser): Promise<User> {
    const { auth } = this.firebaseService;
    const { email, password, displayName, customClaims } = data;

    let user: UserRecord;
    try {
      user = await auth.getUserByEmail(email);
    } catch (e) {
      this.logger.log(`Creating user (${email}, ${JSON.stringify(customClaims)})`);

      // wait for cloud function to add role and level
      user = await auth.createUser({ email, password, displayName });
      await new Promise((resolve) => setTimeout(resolve, 4000));
    } finally {
      // update custom claims
      await auth.setCustomUserClaims(user.uid, customClaims);
    }

    return await auth.getUser(user.uid) as User;
  }

  async findOneBy(key: 'id' | 'email', value: string): Promise<User> {
    switch (key) {
      case 'id':
        return await this.firebaseService.auth.getUser(value) as User;
      case 'email':
        return await this.firebaseService.auth.getUserByEmail(value) as User;
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
    const customClaims = (await this.firebaseService.auth.getUser(uid)).customClaims;
    await this.firebaseService.auth.setCustomUserClaims(uid, { ...customClaims, ...claims });
  }

  async createWellness(user: User, data: Partial<Wellness>): Promise<Wellness> {
    this.logger.log(`Creating wellness for user (${user.uid}, ${JSON.stringify(data)})`);

    // find if any wellness record exists for the current day
    const found = await this.findWellness(user);
    if (found)
      throw new BadRequestException('You already submitted your wellness for today');

    return await this.wellnessRepository.create({
      userId: user.uid,
      date: new Date(),
      sleep: data.sleep,
      fatigue: data.fatigue,
      soreness: data.soreness,
      comment: data.comment,
    });
  }

  /**
   * Returns the wellness record for the current day for the given user
   */
  async findWellness(user: User, filter?: Filter<Wellness>): Promise<Wellness> {
    const startDate = Timestamp.fromDate(filter?.date.value || dayjs().startOf('day').toDate());
    const endDate = Timestamp.fromDate(filter?.date.value || dayjs().endOf('day').toDate());

    return await this.wellnessRepository.findOneByMany([
      { field: 'userId', value: user.uid, operator: '==' },
      { field: 'date', value: startDate, operator: '>=' },
      { field: 'date', value: endDate, operator: '<=' },
    ]);
  }
}