import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Query } from 'firebase-admin/firestore';

import { AuthService } from '@src/auth/auth.service';
import { CreateUserDto } from '@src/auth/dto/create-user.dto';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { User } from '@src/common/type/firebase-auth.type';
import { UserRef } from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';

import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Profile } from '../entity/profile.entity';
import { ProfileRepository } from '../repository/profile.repository';

@Injectable()
export class ProfileService implements Permission<Profile, Institution> {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    private readonly firebaseService: FirebaseService,
    private readonly repository: ProfileRepository,
  ) {}

  async findOneByIdOrFail(id: string): Promise<Profile> {
    const item = await this.repository.findById(id);
    if (!item) throw new BadRequestException('User not found');
    return item;
  }

  async findAllByInstitution(institution: Institution) {
    return await this.repository.findAllByInstitution(institution);
  }

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return await this.repository.findAll(query);
  }

  async findById(ref: UserRef) {
    const authUser = await this.authService.findOneBy('id', ref.uid);
    if (!authUser) throw new NotFoundException('User does not exist');
    return await this.repository.findOneOrCreate(ref);
  }

  async upsert(input: CreateUserDto): Promise<void> {
    const user = await this.authService.upsert(input);
    if (user) await this.repository.save({ id: user.uid });
  }

  @LogMethod()
  async updateProfile(user: User, input: UpdateProfileDto) {
    const { userId } = input;
    delete input.userId;
    await this.repository.update(userId, input);
  }

  canView(user: User, entity: Profile, institution?: Institution) {
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

  canEdit(user: User, entity: Profile, institution?: Institution) {
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
