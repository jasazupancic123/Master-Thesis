import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { startOfDay } from 'date-fns';
import { FieldPath, FieldValue, Transaction } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/lib/auth';
import { FirestoreCollection } from 'src/common/enum/firestore-collection.enum';
import { Wrapper } from 'src/common/type/wrapper.type';
import { TrainingService } from 'src/training/service/training.service';
import { User } from '../../common/type/firebase-auth.type';
import {
  UserMetaRef,
  UserRef,
} from '../../common/type/firebase-firestore.type';
import { Environment } from '../../config/environment-validation-schema';
import { FirebaseService } from '../../firebase/firebase.service';
import { FilterUserQueryDto } from '../dto/filter-user-query.dto';
import { UpdateUserClaimsDto } from '../dto/update-user.dto';
import { UserMeta } from '../entity/user-meta.entity';
import { CreateUser, UserEntity } from '../entity/user.entity';
import { SportLevel } from '../enum/sport-level.enum';
import { UserMetaRepository } from '../repository/user-meta.repository';
import { UserRepository } from '../repository/user.repository';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    private readonly configService: ConfigService<Environment>,
    private readonly firebaseService: FirebaseService,
    private readonly userRepository: UserRepository,
    private readonly userMetaRepository: UserMetaRepository,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
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
      if (user?.uid) await auth.setCustomUserClaims(user.uid, customClaims);
    }

    return user?.uid ? ((await auth.getUser(user.uid)) as User) : null;
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

  async getAdminId(): Promise<string> {
    const users = await this.findAll({
      emails: [this.configService.get('FIREBASE_ADMIN_EMAIL')],
    });

    return users[0].uid;
  }

  async updateClaims(uid: string, claims: UpdateUserClaimsDto): Promise<void> {
    const customClaims = (await this.firebaseService.auth.getUser(uid))
      .customClaims;

    await this.firebaseService.auth.setCustomUserClaims(uid, {
      ...customClaims,
      ...claims,
    });
  }

  async addAthlete(input: Omit<CreateUser, 'customClaims'>) {
    const { email, displayName, password } = input;

    const firebaseAuthUser = await this.firebaseService.auth.createUser({
      email,
      displayName,
      password,
    });

    await this.userRepository.addDoc({
      id: firebaseAuthUser.uid,
      groupsIds: [],
      level: SportLevel.BEGINNER,
    });

    return firebaseAuthUser;
  }

  async addGroup(transaction: Transaction, userId: string, groupId: string) {
    const docRef = this.userRepository.doc(userId);
    transaction.update(docRef, { groupsIds: FieldValue.arrayUnion(groupId) });
  }

  async removeGroup(transaction: Transaction, userId: string, groupId: string) {
    const docRef = this.userRepository.doc(userId);
    transaction.update(docRef, { groupsIds: FieldValue.arrayRemove(groupId) });
  }

  async getMeta(ref: UserMetaRef): Promise<UserMeta> {
    return await this.userMetaRepository.getDoc(ref);
  }

  async addOrUpdateMeta(ref: UserMetaRef, input: UserMeta): Promise<UserMeta> {
    const meta = await this.userMetaRepository.getDoc(ref);

    if (!meta) await this.userMetaRepository.addDoc(ref, input);
    else await this.userMetaRepository.updateDoc(ref, input);

    return input;
  }

  async updateMeta(ref: UserMetaRef, input: UserMeta): Promise<void> {
    return await this.userMetaRepository.updateDoc(ref, input);
  }

  async getLastMeta(ref: UserRef): Promise<UserMeta> {
    const snapshot = await this.userMetaRepository
      .collection(ref)
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.userMetaRepository.serialize(snapshot.docs[0]);
  }

  async getLastMetas(userIds: string[]): Promise<UserMeta[]> {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.USER_META)
      .where('userId', 'in', userIds)
      .orderBy('date', 'desc')
      .get()
      .then(({ docs }) =>
        docs.map((doc) => this.userMetaRepository.serialize(doc)),
      );
  }
}
