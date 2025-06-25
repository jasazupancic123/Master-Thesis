import { Training } from '../../../src/training/entity/training.entity';
import { Institution } from '../../../src/institution/entity/institution.entity';
import { TestUser } from './auth.type';
import { Group } from '../../../src/group/entity/group.entity';

export type TestInstitution = Institution & {
  manager: TestUser;
  trainers: TestUser[];
  athletes: TestUser[];
};

export type TestTraining = Training & { group?: Group };
