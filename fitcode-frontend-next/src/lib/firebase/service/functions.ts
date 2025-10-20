import type { Functions } from 'firebase/functions';
import { httpsCallable } from 'firebase/functions';

import type { UserRole } from '@/core/profile/enum/user-role.enum';
import { getFirebaseFunctions } from '@/lib/firebase/config';

export class FirebaseFunctionsUtil {
  private readonly functions: Functions;

  constructor() {
    this.functions = getFirebaseFunctions();
  }

  async createUserWithRole(input: {
    email: string;
    password: string;
    role: UserRole;
    displayName: string;
    photoURL?: string;
  }) {
    try {
      await httpsCallable(this.functions, 'createUserWithRole')(input);
    } catch (e: unknown) {
      if (e instanceof Error && 'details' in e) {
        const authCode = (e.details as { originalCode: string })?.originalCode;
        switch (authCode) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-email':
          case 'auth/invalid-password':
          case 'auth/weak-password':
          // throw new Error('Email or password is incorrect');
          case 'auth/email-already-exists':
            throw new Error('Email already exists');
          case 'auth/app-deleted':
          case 'auth/app-not-authorized':
          case 'auth/argument-error':
          case 'auth/invalid-api-key':
          case 'auth/operation-not-allowed':
            throw new Error('Internal error');
        }

        throw new Error(e.message);
      }
    }
  }
}
