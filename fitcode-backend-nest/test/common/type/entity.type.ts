import type { Group } from '@src/group/entity/group.entity';
import type { Institution } from '@src/institution/entity/institution.entity';
import type { Training } from '@src/training/entity/training.entity';

import type { TestUser } from './auth.type';

export type TestInstitution = Institution & {
  manager: TestUser;
  trainers: TestUser[];
  athletes: TestUser[];
};

export type TestTraining = Training & { group?: Group };
