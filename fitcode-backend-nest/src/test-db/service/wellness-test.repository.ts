import { Injectable } from '@nestjs/common';

import { WellnessRef } from '@src/common/type/firestore.type';
import { Wellness } from '@src/user/entity/wellness.entity';
import { WellnessRepository } from '@src/user/repository/wellness.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class WellnessTestRepository extends TestRepositoryMixin<
  Wellness,
  WellnessRef
>()(WellnessRepository) {}
