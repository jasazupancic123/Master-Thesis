import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/lib/auth';
import { DateTime } from 'luxon';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { CustomClaims, User } from '@src/common/type/firebase-auth.type';
import {
  InstitutionRef,
  UserRef,
  WellnessRef,
} from '@src/common/type/firestore.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionRepository } from '@src/institution/repository/institution.repository';

import { FilterUserQueryDto } from '../dto/filter-user-query.dto';
import { UpdateUserClaimsDto } from '../dto/update-user-claims.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { UserEntity } from '../entity/user.entity';
import { WellnessZScore } from '../entity/wellnes-z-score.entity';
import { Wellness } from '../entity/wellness.entity';
import { UserRepository } from '../repository/user.repository';
import { WellnessRepository } from '../repository/wellness.repository';

type CreateUser = Pick<User, 'email' | 'displayName'> & {
  password: string;
  institutionId?: string;
} & { customClaims: CustomClaims };

@Injectable()
export class UserService implements Permission<UserEntity, Institution> {
  private logger = new Logger(UserService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly institutionRepository: InstitutionRepository,
    private readonly userRepository: UserRepository,
    private readonly wellnessRepository: WellnessRepository,
  ) {}

  async findOne(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findById(id);
  }

  async findOneByIdOrFail(id: string): Promise<UserEntity> {
    const item = await this.userRepository.findById(id);
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
    return await this.userRepository.findAll(query);
  }

  async findOneOrFail(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

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

  async findProfile(ref: UserRef) {
    return await this.userRepository.findById(ref.uid);
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

    await this.userRepository.save({ id: user.uid });
    return user?.uid ? ((await auth.getUser(user.uid)) as User) : null;
  }

  async updateClaims(uid: string, claims: UpdateUserClaimsDto): Promise<void> {
    const customClaims = (await this.firebaseService.auth.getUser(uid))
      .customClaims;

    await this.firebaseService.auth.setCustomUserClaims(uid, {
      ...customClaims,
      ...claims,
    });
  }

  @LogMethod()
  async updateProfile(user: User, input: UpdateUserProfileDto) {
    const { userId } = input;
    delete input.userId;
    await this.userRepository.update(userId, input);
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

  async getWellness(ref: WellnessRef): Promise<Wellness> {
    return await this.wellnessRepository.findById(ref);
  }

  async addOrUpdateWellness(
    ref: WellnessRef,
    input: Wellness,
  ): Promise<Wellness> {
    this.logger.log(
      `User ${ref.uid} is adding / updating wellness: ${JSON.stringify(input)}`,
    );

    const meta = await this.wellnessRepository.findById(ref);
    if (!meta) await this.wellnessRepository.save(input, ref);
    else await this.wellnessRepository.update(ref, input);

    return input;
  }

  async updateWellness(ref: WellnessRef, input: Wellness): Promise<void> {
    return await this.wellnessRepository.update(ref, input);
  }

  async getLatestWellnessByUser(ref: UserRef): Promise<Wellness> {
    return await this.wellnessRepository.getLatestByUser(ref);
  }

  async getLastBodyweight(ref: UserRef): Promise<number | null> {
    return await this.wellnessRepository.getLastBodyweight(ref);
  }

  async getWellnessByInstitutionId(
    ref: InstitutionRef,
  ): Promise<WellnessZScore[]> {
    const institution = await this.institutionRepository.findById(
      ref.institutionId,
    );

    if (!institution) throw new NotFoundException('Institution not found');

    const userIds: UserRef[] = institution.athleteIds.map((id) => ({
      uid: id,
    }));

    const now = DateTime.now();

    const startOfToday = now.startOf('day').toJSDate();
    const startOf10DaysBefore = now
      .startOf('day')
      .minus({ days: 10 })
      .startOf('day')
      .toJSDate();

    const wellness = userIds.length
      ? await Promise.all(
          userIds.map(async (userRef) => {
            const wellnessDocs = await this.wellnessRepository.findAll(
              (q) =>
                q
                  .where('userId', '==', userRef.uid)
                  .where('date', '>=', Timestamp.fromDate(startOf10DaysBefore)),
              { ...userRef, date: null },
            );

            const todayZ = this.getWellnessZScore(wellnessDocs, startOfToday);

            return [todayZ].filter((z) => z !== null);
          }),
        )
      : [];

    return wellness.flat();
  }

  getWellnessZScore(
    wellnessDocs: Wellness[],
    date: Date,
  ): WellnessZScore | null {
    const dayStart = DateTime.fromJSDate(date).startOf('day');

    const foundWellness = wellnessDocs.find((wd) =>
      DateTime.fromJSDate(wd.date).hasSame(dayStart, 'day'),
    );
    if (!foundWellness) return null;

    if (wellnessDocs.length < 2) return foundWellness;

    const history = wellnessDocs.filter(
      (wd) => DateTime.fromJSDate(wd.date) < dayStart,
    );

    const sleepHist = history
      .map((w) => w.sleep)
      .filter(this.commonService.number.isNumber);
    const fatigueHist = history
      .map((w) => w.fatigue)
      .filter(this.commonService.number.isNumber);
    const sorenessHist = history
      .map((w) => w.soreness)
      .filter(this.commonService.number.isNumber);

    const sleepMean =
      sleepHist.length >= 1
        ? this.commonService.number.getMean(sleepHist)
        : null;
    const fatigueMean =
      fatigueHist.length >= 1
        ? this.commonService.number.getMean(fatigueHist)
        : null;
    const sorenessMean =
      sorenessHist.length >= 1
        ? this.commonService.number.getMean(sorenessHist)
        : null;

    const sleepSD = this.commonService.number.getStandardDeviation(sleepHist);
    const fatigueSD =
      this.commonService.number.getStandardDeviation(fatigueHist);
    const sorenessSD =
      this.commonService.number.getStandardDeviation(sorenessHist);

    return {
      ...foundWellness,
      sleepZScore: this.commonService.number.getZScore(
        foundWellness.sleep,
        sleepMean,
        sleepSD,
      ),
      fatigueZScore: this.commonService.number.getZScore(
        foundWellness.fatigue,
        fatigueMean,
        fatigueSD,
      ),
      sorenessZScore: this.commonService.number.getZScore(
        foundWellness.soreness,
        sorenessMean,
        sorenessSD,
      ),
    };
  }

  canView(user: User, entity: UserEntity, institution?: Institution) {
    if (this.firebaseService.isAdmin(user)) return true; // admin can view any user
    if (user.uid === entity.id) return true; // user can view their own profile

    if (institution) {
      const members = institution.trainerIds
        .concat(institution.athleteIds)
        .concat([institution.ownerId]);

      if (!members.includes(user.uid) || !members.includes(entity.id))
        return false;

      return true; // institution members can view each other
    }

    return false;
  }

  canEdit(user: User, entity: UserEntity, institution?: Institution) {
    if (this.firebaseService.isAdmin(user)) return true; // admin can edit any user
    if (user.uid === entity.id) return true; // user can edit their own profile

    if (institution) {
      const members = institution.trainerIds.concat(institution.athleteIds); // no owner

      if (
        this.firebaseService.isManager(user) &&
        institution.ownerId === user.uid &&
        members.includes(entity.id)
      )
        return true; // manager can edit institution members

      if (
        this.firebaseService.isTrainer(user) &&
        institution.athleteIds.includes(entity.id)
      )
        return true; // trainer can edit athletes
    }

    return false;
  }
}
