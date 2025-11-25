import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 } from 'uuid';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { AuthService } from '@src/auth/service/auth.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { Create } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import { BatchOperation, BatchWriteOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionMember } from '@src/institution/entity/institution-member.entity';
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

  async findOneById(uid: string): Promise<Profile> {
    return await this.repository.findOneOrCreate(uid);
  }

  async findAllByManager(user: User): Promise<Profile[]> {
    if (!this.firebase.isManager(user)) throw new UnauthorizedException();

    const institution = await this.institutionService.findByOwnerId(user.uid);
    if (!institution)
      throw new BadRequestException('User does not own any institution');

    return await this.repository.findAllByInstitution(institution);
  }

  async findAllByInstitution(
    institution: Institution,
    skipFields: (keyof AuthProfileMerged)[] = [],
  ): Promise<AuthProfileMerged[]> {
    const users = await this.authService.findAllByInstitution(institution);
    const profiles = await this.repository.findAllByInstitution(institution);

    return users
      .map((user) => {
        const profile = profiles.find((p) => p.uid === user.uid);
        if (!profile) return null;

        const merged: AuthProfileMerged = {
          uid: user.uid,
          email: user.email!,
          role: user.customClaims?.role?.[0],
          faceEmbedding: [],
          height: profile.height || 0,
          weight: profile.weight || 0,
          displayName: user.displayName || '',
          photoURL: user.photoURL,
          sport: profile.sport,
          level: profile.level,
          gender: profile.gender,
          birthDate: profile.birthDate,
          photoURLBase64: profile.photoURLBase64,
        };

        skipFields.forEach((field) => delete merged[field]);
        return merged;
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
          height: 0,
          weight: 0,
        }),
      }),
    );

    // add users to institution
    const institutionOperations: BatchWriteOperation<InstitutionMember>[] =
      successfulUsers
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

  async create(input: Create<Profile>) {
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
      const members = institution.trainerIds
        .concat(institution.athleteIds)
        .concat([institution.ownerId]);

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
      const members = institution.trainerIds.concat(institution.athleteIds); // no owner

      if (
        this.firebase.isManager(user) &&
        institution.ownerId === user.uid &&
        members.includes(entity.uid)
      )
        return true; // manager can edit institution members

      if (
        this.firebase.isTrainer(user) &&
        institution.athleteIds.includes(entity.uid)
      )
        return true; // trainer can edit athletes
    }

    return false;
  }
}
