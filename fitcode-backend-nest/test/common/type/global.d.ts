import type { TestUser } from './auth.type';

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
