import { httpsCallable } from 'firebase/functions';

import { functions } from '@/common/config/firebase.config';
import type { UserRole } from '@/controller/user/enum/user-role.enum';

export class FirebaseFunctionsUtil {
  async createUserWithRole(input: {
    email: string;
    password: string;
    role: UserRole;
    displayName: string;
  }) {
    try {
      await httpsCallable(functions, 'createUserWithRole')(input);
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
