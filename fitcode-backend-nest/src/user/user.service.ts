import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FieldValue, Query } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/lib/auth';
import { FirestoreCollection } from '../common/enum/firestore-collection.enum';
import { Update } from '../common/type/entity.type';
import { CustomClaims, User } from '../common/type/firebase-auth.type';
import { WellnessRef, UserRef } from '../common/type/firestore.type';
import { Environment } from '../config/environment-validation-schema';
import { FirebaseService } from '../firebase/firebase.service';
import { FilterUserQueryDto } from './dto/filter-user-query.dto';
import { UpdateUserClaimsDto } from './dto/update-user-claims.dto';
import { Wellness } from './entity/wellness.entity';
import { UserEntity } from './entity/user.entity';
import { WellnessRepository } from './repository/user-meta.repository';
import { UserRepository } from './repository/user.repository';

type CreateUser = Pick<User, 'email' | 'displayName'> & {
  password: string;
  institutionId?: string;
} & { customClaims: CustomClaims };

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    private readonly configService: ConfigService<Environment>,
    private readonly firebaseService: FirebaseService,
    private readonly userRepository: UserRepository,
    private readonly wellnessRepository: WellnessRepository,
  ) {}

  async findOne(id: string): Promise<UserEntity | null> {
    return await this.userRepository.getDoc(id);
  }

  async findOneByIdOrFail(id: string): Promise<UserEntity> {
    const item = await this.userRepository.getDoc(id);
    if (!item) throw new BadRequestException('User not found');
    return item;
  }

  getDoc(id: string) {
    return this.userRepository.doc(id);
  }

  getCollection() {
    return this.userRepository.collection();
  }

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return await this.userRepository.getDocs(query);
  }

  async findOneOrFail(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    if (!user) throw new BadRequestException('User not found');
    return user;
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

  async findProfile(ref: UserRef) {
    return await this.userRepository.getDoc(ref.uid);
  }

  async findAll(filter?: FilterUserQueryDto): Promise<User[]> {
    if (filter?.ids?.length === 0 || filter?.emails?.length === 0) return [];
    return await this.firebaseService.authUsers(filter);
  }

  async findAllOrFail(filter?: FilterUserQueryDto): Promise<User[]> {
    let users = await this.findAll(filter);
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

  async upsert(data: CreateUser): Promise<User> {
    const { auth } = this.firebaseService;
    const { email, password, displayName, customClaims, institutionId } = data;

    let user: UserRecord;
    try {
      user = await auth.getUserByEmail(email);
    } catch (e) {
      this.logger.log(`Creating user (${email}, ${JSON.stringify(data)})`);
      user = await auth.createUser({ email, password, displayName });
    } finally {
      if (user?.uid) await auth.setCustomUserClaims(user.uid, customClaims);
    }

    await this.userRepository.addDoc({ id: user.uid });
    return user?.uid ? ((await auth.getUser(user.uid)) as User) : null;
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

  async updateProfile(ref: UserRef, input: Update<UserEntity>) {
    this.logger.log(
      `User ${ref.uid} is updating profile: ${JSON.stringify(input)}`,
    );

    await this.userRepository.updateDoc(ref.uid, input);
  }

  async addTrainer(ref: UserRef, trainerId: string) {
    await this.userRepository.doc(ref.uid).update({
      trainersIds: FieldValue.arrayUnion(trainerId),
    });
  }

  async removeTrainer(ref: UserRef, trainerId: string) {
    await this.userRepository.doc(ref.uid).update({
      trainersIds: FieldValue.arrayRemove(trainerId),
    });
  }

  async addAthlete(user: User, input: Omit<CreateUser, 'customClaims'>) {
    const { email, displayName, password } = input;

    this.logger.log(
      `User ${user.uid} is registering new athlete: ${JSON.stringify(input)})`,
    );

    return await this.firebaseService.auth.createUser({
      email,
      displayName,
      password,
    });
  }

  async getMeta(ref: WellnessRef): Promise<Wellness> {
    return await this.wellnessRepository.getDoc(ref);
  }

  async addOrUpdateWellness(
    ref: WellnessRef,
    input: Wellness,
  ): Promise<Wellness> {
    this.logger.log(
      `User ${ref.uid} is adding / updating wellness: ${JSON.stringify(input)}`,
    );

    const meta = await this.wellnessRepository.getDoc(ref);
    if (!meta) await this.wellnessRepository.addDoc(ref, input);
    else await this.wellnessRepository.updateDoc(ref, input);

    return input;
  }

  async updateWellness(ref: WellnessRef, input: Wellness): Promise<void> {
    return await this.wellnessRepository.updateDoc(ref, input);
  }

  async getLastMeta(ref: UserRef): Promise<Wellness> {
    const snapshot = await this.wellnessRepository
      .collection(ref)
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.wellnessRepository.serialize(snapshot.docs[0]);
  }

  async getRecentWellness(userIds: string[]): Promise<Wellness[]> {
    try {
      const collectionGroup = this.firebaseService.firestore.collectionGroup(
        FirestoreCollection.WELLNESS,
      );

      return await this.firebaseService.batchIn(
        'userId',
        userIds,
        collectionGroup,
        (q) => q.orderBy('date', 'desc'),
      );
    } catch (e: any) {
      return [];
    }
  }
}
