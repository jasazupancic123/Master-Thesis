import { Injectable } from '@nestjs/common';

import { Profile } from '@src/profile/entity/profile.entity';
import { ProfileRepository } from '@src/profile/repository/profile.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class ProfileTestRepository extends TestRepositoryMixin<Profile>()(
  ProfileRepository,
) {}
