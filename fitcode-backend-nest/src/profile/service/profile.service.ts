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
import { User } from '@src/common/type/firebase-auth.type';
import { BatchOperation, BatchWriteOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionMember } from '@src/institution/entity/institution-member.entity';
import { InstitutionService } from '@src/institution/service/institution.service';

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
  ) {}

  async findOneById(uid: string): Promise<Profile> {
    return await this.repository.findOneOrCreate(uid);
  }

  async findAll(user: User): Promise<Profile[]> {
    // if manager or trainer, return all profiles for institution they belong to, for athlete only his profile
    switch (user.customClaims?.role[0]) {
      case UserRole.ADMIN:
        return [];
      case UserRole.MANAGER: {
        const institution = await this.institutionService.findByOwnerId(
          user.uid,
        );

        if (!institution) return [];
        return await this.repository.findAllByInstitution(institution);
      }
      case UserRole.TRAINER: {
        const institutions = await this.institutionService.findAll(user);
        const profiles: Profile[] = [];

        for (const institution of institutions) {
          const institutionProfiles =
            await this.repository.findAllByInstitution(institution);
          profiles.push(...institutionProfiles);
        }

        return profiles;
      }
      case UserRole.ATHLETE:
        return [await this.findOneById(user.uid)];
      default:
        throw new BadRequestException('User has no role assigned');
    }
  }

  /**
   * Returns all profiles the user has access to, merge with auth users.
   */
  async findAllMerged(user: User): Promise<AuthProfileMerged[]> {
    const profiles = await this.findAll(user);
    const authUsers = await this.firebase.authUsers({
      ids: profiles.map((p) => p.uid),
    });

    return profiles
      .map((profile) => {
        const authUser = authUsers.find((u) => u.uid === profile.uid);
        if (!authUser) return null;

        return {
          uid: profile.uid,
          email: profile.email,
          role: authUser.customClaims?.role?.[0],
          faceEmbedding: [],
          height: profile.height,
          weight: profile.weight,
          displayName: authUser.displayName || '',
          photoURL: authUser.photoURL || '',
          photoURLBase64: profile.photoURLBase64 || '',
        };
      })
      .filter(Boolean);
  }

  async findAllByInstitution(institution: Institution) {
    return await this.repository.findAllByInstitution(institution);
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
          this.institutionService.buildAddMembersOperation(
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
