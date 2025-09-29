import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UidIdentifier } from 'firebase-admin/auth';
import { v4 } from 'uuid';

import { AuthService } from '@src/auth/auth.service';
import { UserRole } from '@src/auth/enum/user-role.enum';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { User } from '@src/common/type/firebase-auth.type';
import { BatchSetOperation } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';

import { ImportProfileDto } from '../dto/import-profiles.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Profile } from '../entity/profile.entity';
import { ProfileRepository } from '../repository/profile.repository';

@Injectable()
export class ProfileService implements Permission<Profile, Institution> {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    private readonly firebase: FirebaseService,
    private readonly repository: ProfileRepository,
  ) {}

  async findOneById(uid: string): Promise<Profile> {
    return await this.repository.findOneOrCreate({ uid });
  }

  async findAllByInstitution(institution: Institution) {
    return await this.repository.findAllByInstitution(institution);
  }

  async importProfiles(input: ImportProfileDto[]) {
    if (input.length === 0)
      return { successCount: 0, failureCount: 0, errors: [] };

    // roles can be only trainer and athlete
    input.forEach((user) => {
      if (![UserRole.TRAINER, UserRole.ATHLETE].includes(user.role))
        throw new BadRequestException('Invalid role');
    });

    const importInput = input.map((user) => ({ ...user, uid: v4() }));
    await this.authService.importUsers(importInput);
    const { notFound } = await this.firebase.auth.getUsers(importInput);

    // filter out only successfully imported users
    const data = importInput.filter((user) =>
      notFound.every((nf: UidIdentifier) => nf.uid !== user.uid),
    );

    // create profiles for successfully imported users
    const operations: BatchSetOperation<Profile>[] = data.map(
      ({ uid, sport, level, gender, birthDate }) => ({
        operation: 'set',
        ref: this.repository.doc(uid),
        data: this.firebase.buildCreateQuery<Profile>({
          id: uid,
          sport,
          level,
          gender,
          birthDate,
        }),
      }),
    );

    await this.firebase.paginateBatches(operations);
    return data.map((u) => ({ uid: u.uid, email: u.email }));
  }

  @LogMethod()
  async updateProfile(user: User, input: UpdateProfileDto) {
    const { userId } = input;
    delete input.userId;
    await this.repository.update(userId, input);
  }

  canView(user: User, entity: Profile, institution?: Institution) {
    if (this.firebase.isAdmin(user)) return true; // admin can view any user
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

  canEdit(user: User, entity: Profile, institution?: Institution) {
    if (this.firebase.isAdmin(user)) return true; // admin can edit any user
    if (user.uid === entity.id) return true; // user can edit their own profile

    if (institution) {
      const members = institution.trainerIds.concat(institution.athleteIds); // no owner

      if (
        this.firebase.isManager(user) &&
        institution.ownerId === user.uid &&
        members.includes(entity.id)
      )
        return true; // manager can edit institution members

      if (
        this.firebase.isTrainer(user) &&
        institution.athleteIds.includes(entity.id)
      )
        return true; // trainer can edit athletes
    }

    return false;
  }
}
