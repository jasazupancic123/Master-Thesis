import { Institution } from '../../../src/institution/entity/institution.entity';
import { TestUser } from './auth.type';

export type TestInstitution = Institution & {
  manager: TestUser;
  trainers: TestUser[];
  athletes: TestUser[];
};
