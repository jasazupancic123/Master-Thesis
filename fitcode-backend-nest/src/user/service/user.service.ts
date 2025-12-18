import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 } from 'uuid';

import { CreateUserDto } from '@src/auth/dto/create-user.dto';
import { AuthUser } from '@src/auth/entity/auth-user.entity';
import { UserRole } from '@src/auth/enum/user-role.enum';
import { AuthService } from '@src/auth/service/auth.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create } from '@src/common/type/entity.type';
import {
  CustomClaims,
  FirebaseUser,
} from '@src/common/type/firebase-auth.type';
import { UserExerciseStatsRef } from '@src/common/type/firestore.type';
import { BatchOperation } from '@src/common/type/orm.type';
import { ValidateRowError } from '@src/common/type/validate.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionService } from '@src/institution/service/institution.service';
import { MemberService } from '@src/institution/service/member.service';

import { ImportUserDto } from '../dto/import-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Profile } from '../entity/profile.entity';
import { User } from '../entity/user.entity';
import { UserExerciseStats } from '../entity/user-exercise-stats.entity';
import { ProfileRepository } from '../repository/profile.repository';
import { UserExerciseStatsRepository } from '../repository/user-exercise-stats.repository';
import { UserType } from '../type/user.type';

@Injectable()
export class UserService implements Permission<Profile, Institution> {
  constructor(
    private readonly common: CommonService,
    private readonly firebase: FirebaseService,
    private readonly repository: ProfileRepository,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    @Inject(forwardRef(() => InstitutionService))
    private readonly institutionService: Wrapper<InstitutionService>,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: Wrapper<MemberService>,
    private readonly userExerciseStatsRepository: UserExerciseStatsRepository,
  ) {}

  async findOneById(uid: string): Promise<User> {
    const [user, profile] = await Promise.all([
      this.authService.findOneBy('id', uid),
      this.repository.findOneOrCreate(uid),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!profile) throw new NotFoundException('Profile not found');

    return this.mergeAuthProfile(user, profile, {
      skipFields: ['faceEmbedding', 'photoURLBase64'],
    });
  }

  async findAllByInstitution(
    institution: Institution,
    skipFields: (keyof User)[] = [],
  ): Promise<User[]> {
    const [users, profiles] = await Promise.all([
      this.firebase.authUsers({
        ids: [institution.ownerId, ...institution.members.map((m) => m.id)],
      }),
      this.repository.findAllByInstitution(institution),
    ]);

    return users
      .map((user) => {
        const profile = profiles.find((p) => p.uid === user.uid);
        if (!profile) return null;
        return this.mergeAuthProfile(user, profile, { skipFields });
      })
      .filter(Boolean);
  }

  async importUsers(user: FirebaseUser, input: ImportUserDto[]) {
    if (!this.firebase.isManager(user)) throw new UnauthorizedException();

    const institution = await this.institutionService.findByOwnerId(user.uid);
    if (!institution)
      throw new BadRequestException('User does not own any institution');

    if (input.length === 0) return { successful: [], failed: [] };

    // roles can be only trainer and athlete
    input.forEach((user) => {
      if (![UserRole.TRAINER, UserRole.ATHLETE].includes(user.role))
        throw new BadRequestException('Invalid role');
    });

    // only keep profiles that don’t exist yet
    const usersToImport = input.map((u) => ({ ...u, uid: v4() }));
    const result = await this.importAuthUsers(user, usersToImport);

    const successfulUsers = result.successful.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      role: usersToImport.find((p) => p.email === u.email)!.role,
    }));

    // create profiles for successful imports
    const profileOperations: BatchOperation<Profile>[] = successfulUsers.map(
      (profile) => ({
        ref: this.repository.doc(profile.uid),
        operation: 'set',
        data: this.firebase.buildCreateQuery<Profile>({
          uid: profile.uid,
          email: profile.email!,
          wellness: { userId: profile.uid, date: new Date() },
        }),
      }),
    );

    // add users to institution
    const institutionOperations = successfulUsers
      .map(({ uid, role }) =>
        this.memberService.buildAddMembersOperation(
          { institutionId: institution.id },
          [{ id: uid, role }],
        ),
      )
      .flat();

    await this.firebase.paginateBatches([
      ...(profileOperations.filter(Boolean) as BatchOperation<unknown>[]),
      ...(institutionOperations as BatchOperation<unknown>[]),
    ]);

    return result;
  }

  async findAllByManager(user: FirebaseUser): Promise<UserType[]> {
    if (!this.firebase.isManager(user)) throw new UnauthorizedException();

    const institution = await this.institutionService.findByOwnerId(user.uid);
    if (!institution)
      throw new BadRequestException('User does not own any institution');

    return await this.institutionService.findAllMembers(
      user,
      institution.id,
      [],
    );
  }

  @LogMethod()
  async createProfile(input: Create<Omit<Profile, 'wellness'>>) {
    return await this.repository.save(input);
  }

  @LogMethod()
  async update(user: FirebaseUser, uid: string, input: UpdateUserDto) {
    // update profile & auth user
    await this.getUserToUpdate(user, uid);
    await this.repository.update(uid, input);
    await this.firebase.auth.updateUser(uid, input);
  }

  @LogMethod()
  async saveFaceEmbedding(
    user: FirebaseUser,
    userId: string,
    embedding: number[],
  ): Promise<void> {
    const athlete = await this.findOneById(user.uid);
    if (!athlete) throw new NotFoundException('User not found');

    if (!this.canEdit(user, athlete))
      throw new ForbiddenException('Cannot edit user');

    await this.repository.update(userId, { faceEmbedding: embedding });
  }

  @LogMethod()
  async register(
    user: FirebaseUser,
    input: CreateUserDto,
  ): Promise<User | null> {
    // admin can register managers, and managers can register trainers and athletes
    console.log('input', input);
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
    const customClaims: CustomClaims = { role: [input.role] };

    try {
      const user = await this.firebase.auth.createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        photoURL: input.photoURL,
      });

      await this.firebase.auth.setCustomUserClaims(user.uid, customClaims);
      await this.createProfile({ ...input, uid: user.uid });

      created = { ...user, customClaims } as AuthUser;
    } catch (e) {
      // if user already exists, fetch it
      if (e.code === 'auth/email-already-exists') {
        const found = await this.authService.findOneBy('email', input.email);

        // if user is already in other institution, throw error
        const userInstitutions = await this.institutionService.findAll(found);
        if (userInstitutions.length > 0)
          throw new BadRequestException(
            'User already belongs to an institution',
          );

        created = found as AuthUser;
      } else throw e;
    }

    // if institution is defined, add user to institution
    if (institution)
      await this.institutionService.addMember(
        { role: input.role },
        { institutionId: institution.id, uid: created.uid },
      );

    return {
      ...created,
      role: input.role,
      email: created.email!,
      createdAt: new Date(),
      updatedAt: new Date(),
      wellness: { userId: created.uid, date: new Date() },
      birthDate: input.birthDate,
      gender: input.gender,
    };
  }

  async getExerciseStats(
    ref: UserExerciseStatsRef,
  ): Promise<UserExerciseStats> {
    return await this.userExerciseStatsRepository.findById(ref);
  }

  async checkAndSaveRepMax(
    ref: UserExerciseStatsRef,
    reps: number,
    loadKg: number,
  ) {
    // calculate new 1RM
    const newRepMax = this.common.number.rm(loadKg, reps);

    // find current rep max (or 0 if none)
    const stats = await this.userExerciseStatsRepository.findById(ref);
    const currentRepMax = stats?.repMax
      ? this.common.number.rm(stats.repMax.loadKg, stats.repMax.reps)
      : 0;

    if (newRepMax > currentRepMax) {
      // new 1RM is better, save it
      if (!stats)
        await this.userExerciseStatsRepository.save({
          userId: ref.uid,
          exerciseId: ref.exerciseId,
          timestamp: new Date(),
          repMax: { reps, loadKg },
        });
      else
        await this.userExerciseStatsRepository.update(ref, {
          timestamp: new Date(),
          repMax: { reps, loadKg },
        });
    }
  }

  canView(user: FirebaseUser, entity: User, institution?: Institution) {
    if (this.firebase.isAdmin(user)) return true; // admin can view any user
    if (user.uid === entity.uid) return true; // user can view their own profile

    if (institution) {
      const members = this.institutionService.getMemberIds(institution);

      if (!members.includes(user.uid) || !members.includes(entity.uid))
        return false;

      return true; // institution members can view each other
    }

    return false;
  }

  canEdit(user: FirebaseUser, entity: User, institution?: Institution) {
    if (this.firebase.isAdmin(user)) return true; // admin can edit any user
    if (user.uid === entity.uid) return true; // user can edit their own profile

    if (institution) {
      const members = this.institutionService
        .getMemberIds(institution)
        .filter((id) => id !== institution.ownerId); // exclude owner

      const athletes = this.institutionService
        .getAthletes(institution)
        .map((a) => a.id);

      if (
        this.firebase.isManager(user) &&
        institution.ownerId === user.uid &&
        members.includes(entity.uid)
      )
        return true; // manager can edit institution members

      if (this.firebase.isTrainer(user) && athletes.includes(user.uid))
        return true; // trainer can edit athletes
    }

    return false;
  }

  async getUserToUpdate(
    mainUser: FirebaseUser,
    userToUpdateId: string,
  ): Promise<FirebaseUser> {
    const userToUpdate = await this.authService.findOneBy('id', userToUpdateId);
    if (!userToUpdate) throw new NotFoundException('User not found');

    const canUpdate = await this.canUpdate(mainUser, userToUpdate);
    if (!canUpdate) throw new ForbiddenException('Cannot update user');

    return userToUpdate;
  }

  async canUpdate(
    mainUser: FirebaseUser,
    userToUpdate: FirebaseUser,
  ): Promise<boolean> {
    // admin can update anyone
    if (this.firebase.isAdmin(mainUser)) return true;

    // athlete can update only himself
    if (this.firebase.isAthlete(mainUser))
      return mainUser.uid === userToUpdate.uid;

    // manager can update himself, trainers and athletes in his institutions
    // trainer can update himself and athletes in his institutions
    const institutions = await this.institutionService.findAll(mainUser);

    if (this.firebase.isManager(mainUser)) {
      const institution = institutions.find((i) => i.ownerId === mainUser.uid);
      if (!institution) return false;

      if (this.institutionService.isTrainer(institution, userToUpdate))
        return true;

      if (this.institutionService.isAthlete(institution, userToUpdate))
        return true;

      return mainUser.uid === userToUpdate.uid;
    }

    if (this.firebase.isTrainer(mainUser)) {
      const trainerInstitutions = institutions.filter((i) =>
        i.members.some((m) => m.id === mainUser.uid),
      );

      if (
        this.firebase.isAthlete(userToUpdate) &&
        trainerInstitutions.some((i) =>
          i.members.some((m) => m.id === userToUpdate.uid),
        )
      )
        return true;

      return mainUser.uid === userToUpdate.uid;
    }

    return false;
  }

  /**
   * Import users from a CSV file. It returns the list of successfully created users
   * and the list of errors for the rows that failed to be created.
   */
  private async importAuthUsers(
    user: FirebaseUser,
    input: (CreateUserDto & { uid: string })[],
  ): Promise<{ successful: AuthUser[]; errors: ValidateRowError[] }> {
    if (input.length === 0) return { successful: [], errors: [] };
    const errors: ValidateRowError[] = [];
    const result: AuthUser[] = [];

    for (let i = 0; i < input.length; i++) {
      const row: ValidateRowError = { row: i + 1, errors: [] };

      try {
        const created = await this.register(user, input[i]);
        if (created)
          result.push({ ...created, customClaims: { role: [input[i].role] } });
      } catch (e) {
        row.errors.push({ field: input[i].email, message: e.message });
      }

      if (row.errors.length > 0) errors.push(row);
    }

    return { successful: result, errors };
  }

  private mergeAuthProfile(
    user: FirebaseUser,
    profile: Profile,
    options?: {
      skipFields?: (keyof User)[];
    },
  ): User {
    const merged: User = {
      uid: user.uid,
      email: user.email!,
      role: user.customClaims?.role?.[0],
      faceEmbedding: profile.faceEmbedding || [],
      displayName: user.displayName || '',
      photoURL: user.photoURL,
      sport: profile.sport,
      level: profile.level,
      gender: profile.gender,
      wellness: profile.wellness,
      birthDate: profile.birthDate,
      photoURLBase64: profile.photoURLBase64,
      createdAt: user.metadata?.creationTime
        ? new Date(user.metadata.creationTime)
        : new Date(),
      updatedAt: user.metadata?.lastSignInTime
        ? new Date(user.metadata.lastSignInTime)
        : new Date(),
    };

    options?.skipFields?.forEach((field) => delete merged[field]);
    return merged;
  }
}
