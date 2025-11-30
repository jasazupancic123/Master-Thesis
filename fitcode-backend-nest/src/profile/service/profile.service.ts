import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 } from 'uuid';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { AuthService } from '@src/auth/service/auth.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { Create } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import { BatchOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionService } from '@src/institution/service/institution.service';
import { MemberService } from '@src/institution/service/member.service';

import { ImportProfileDto } from '../dto/import-profiles.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Profile } from '../entity/profile.entity';
import { ProfileRepository } from '../repository/profile.repository';
import { AuthProfileMerged } from '../type/auth-profile-merged.type';

@Injectable()
export class ProfileService implements Permission<Profile, Institution> {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly repository: ProfileRepository,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    @Inject(forwardRef(() => InstitutionService))
    private readonly institutionService: Wrapper<InstitutionService>,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: Wrapper<MemberService>,
  ) {}

  async findOneById(uid: string): Promise<AuthProfileMerged> {
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

  async findAllByManager(user: User): Promise<AuthProfileMerged[]> {
    if (!this.firebase.isManager(user)) throw new UnauthorizedException();

    const institution = await this.institutionService.findByOwnerId(user.uid);
    if (!institution)
      throw new BadRequestException('User does not own any institution');

    const [users, profiles] = await Promise.all([
      this.authService.findAllByInstitution(institution),
      this.repository.findAllByInstitution(institution),
    ]);

    return users
      .map((user) => {
        const profile = profiles.find((p) => p.uid === user.uid);
        if (!profile) return null;
        return this.mergeAuthProfile(user, profile);
      })
      .filter(Boolean);
  }

  async findAllByInstitution(
    institution: Institution,
    skipFields: (keyof AuthProfileMerged)[] = [],
  ): Promise<AuthProfileMerged[]> {
    const [users, profiles] = await Promise.all([
      this.authService.findAllByInstitution(institution),
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

  async importProfiles(user: User, input: ImportProfileDto[]) {
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
    const profilesToImport = input.map((u) => ({ ...u, uid: v4() }));
    const result = await this.authService.importUsers(user, profilesToImport);

    const successfulUsers = result.successful.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      role: profilesToImport.find((p) => p.email === u.email)!.role,
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

  async create(input: Create<Omit<Profile, 'wellness'>>) {
    return await this.repository.save(input);
  }

  @LogMethod()
  async updateProfile(user: User, input: UpdateProfileDto) {
    const { userId } = input;
    delete input.userId;
    await this.repository.update(userId, input);
  }

  canView(user: User, entity: Profile, institution?: Institution) {
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

  canEdit(user: User, entity: Profile, institution?: Institution) {
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

  private mergeAuthProfile(
    user: User,
    profile: Profile,
    options?: {
      skipFields?: (keyof AuthProfileMerged)[];
    },
  ): AuthProfileMerged {
    const merged: AuthProfileMerged = {
      uid: user.uid,
      email: user.email!,
      role: user.customClaims?.role?.[0],
      faceEmbedding: [],
      displayName: user.displayName || '',
      photoURL: user.photoURL,
      sport: profile.sport,
      level: profile.level,
      gender: profile.gender,
      wellness: profile.wellness,
      birthDate: profile.birthDate,
      photoURLBase64: profile.photoURLBase64,
    };

    options?.skipFields?.forEach((field) => delete merged[field]);
    return merged;
  }
}
