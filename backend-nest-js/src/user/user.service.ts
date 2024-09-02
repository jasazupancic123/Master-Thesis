import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUser, UserDto } from './dto/user.dto';
import { UpdateUserClaimsDto, UpdateUserDto } from './dto/update-user.dto';
import { User } from '../common/type/custom-claims.type';
import { UserRecord } from 'firebase-admin/lib/auth';
import { Filter } from '../common/type/orm.type';
import { Wellness } from './entity/wellness.entity';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { Timestamp } from 'firebase-admin/firestore';
import dayjs from 'dayjs';

@Injectable()
export class UserService {
  private logger: Logger;

  constructor(
    private readonly firebaseService: FirebaseService,
    @InjectRepository(Wellness)
    private readonly wellnessRepository: FirestoreRepository<Wellness>,
  ) {
    this.logger = new Logger(UserService.name);
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

  async findOneById(uid: string): Promise<User> {
    return await this.firebaseService.auth.getUser(uid) as User;
  }

  async findAll(user: User, filter?: Filter<UserDto & { ids?: string[] }>): Promise<User[]> {
    const data = (await this.firebaseService.auth.listUsers()).users as User[];

    // mandatory filter based on user role
    /*const users = data.filter(user => {
      // return all users if user is an admin
      if (this.firebaseService.isAdmin(user))
        return true;

      // return all trainers if user is a manager
      if (this.firebaseService.isManager(user))
        return this.firebaseService.isTrainer(user);

      // return all athletes if user is a trainer
      if (this.firebaseService.isTrainer(user))
        return this.firebaseService.isAthlete(user);

      // return only current user if user is an athlete
      if (this.firebaseService.isAthlete(user))
        return user.uid === user.uid;
    });*/

    // optional filter based on query
    let filtered = data;
    if (filter) {
      const { email, displayName, ids } = filter;

      filtered = data.filter(user => {
        if (ids && !ids.includes(user.uid)) return false;
        if (email && !user.email.includes(email)) return false;
        if (displayName && !user.displayName.includes(displayName)) return false;
        // add more filters here
        return true;
      });
    }

    // remove current user from the list
    return filtered.filter(record => record.uid !== user.uid);
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.firebaseService.auth.getUserByEmail(email) as User;
  }

  async update(uid: string, data: UpdateUserDto): Promise<void> {
    await this.firebaseService.auth.updateUser(uid, data);
  }

  async updateClaims(uid: string, claims: UpdateUserClaimsDto): Promise<void> {
    const customClaims = (await this.findOneById(uid)).customClaims;
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
    const startDate = Timestamp.fromDate(filter?.date || dayjs().startOf('day').toDate());
    const endDate = Timestamp.fromDate(filter?.date || dayjs().endOf('day').toDate());
    
    return await this.wellnessRepository.findOneByMany([
      { field: 'userId', value: user.uid, operator: '==' },
      { field: 'date', value: startDate, operator: '>=' },
      { field: 'date', value: endDate, operator: '<=' },
    ]);
  }
}