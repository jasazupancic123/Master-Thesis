import type { TestUser } from '@/src/common/type/entity.type';

declare global {
  namespace NodeJS {
    interface Global {
      athlete: TestUser;
      trainer: TestUser;
      manager: TestUser;
      admin: TestUser;
    }
  }
}

export {};
