import { User } from '../../../src/common/type/firebase-auth.type';

export type TestUser = User & { token: string };
