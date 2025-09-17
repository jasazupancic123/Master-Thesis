import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Query } from 'firebase-admin/firestore';

import { AuthService } from '@src/auth/auth.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CustomClaims, User } from '@src/common/type/firebase-auth.type';
import { UserRef } from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';

import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Profile } from '../entity/profile.entity';
import { ProfileRepository } from '../repository/profile.repository';

type CreateUser = Pick<User, 'email' | 'displayName'> & {
  password: string;
  institutionId?: string;
} & { customClaims: CustomClaims };

@Injectable()
export class ProfileService implements Permission<Profile, Institution> {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    private readonly firebaseService: FirebaseService,
    private readonly profile: ProfileRepository,
  ) {}

  async findOne(id: string): Promise<Profile | null> {
    return await this.profile.findById(id);
  }

  async findOneByIdOrFail(id: string): Promise<Profile> {
    const item = await this.profile.findById(id);
    if (!item) throw new BadRequestException('User not found');
    return item;
  }

  getDoc(id: string) {
    return this.profile.doc(id);
  }

  getCollection() {
    return this.profile.collection();
  }

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return await this.profile.findAll(query);
  }

  async findOneOrFail(id: string): Promise<Profile> {
    const user = await this.findOne(id);
    if (!user) throw new BadRequestException('User not found');
    return user;
  }
  async findProfile(ref: UserRef) {
    return await this.profile.findById(ref.uid);
  }

  async upsert(data: CreateUser): Promise<void> {
    const user = await this.authService.upsert(data);
    if (user) await this.profile.save({ id: user.uid });
  }

  @LogMethod()
  async updateProfile(user: User, input: UpdateProfileDto) {
    const { userId } = input;
    delete input.userId;
    await this.profile.update(userId, input);
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
