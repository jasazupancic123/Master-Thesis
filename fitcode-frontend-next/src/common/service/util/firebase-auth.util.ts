import { FirebaseError } from 'firebase/app';
import type { UserCredential } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import { auth } from '@/common/config/firebase.config';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export const isAdmin = (role: UserRole[]) => role.includes(UserRole.ADMIN);
export const isManager = (role: UserRole[]) => role.includes(UserRole.MANAGER);
export const isTrainer = (role: UserRole[]) => role.includes(UserRole.TRAINER);
export const isAthlete = (role: UserRole[]) => role.includes(UserRole.ATHLETE);

export class FirebaseAuthUtil {
  static async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      if (e instanceof FirebaseError) {
        switch (e.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-email':
          case 'auth/weak-password':
            throw new Error('Email or password is incorrect');
          case 'auth/app-deleted':
          case 'auth/app-not-authorized':
          case 'auth/argument-error':
          case 'auth/invalid-api-key':
          case 'auth/operation-not-allowed':
            throw new Error('Internal error');
          default:
            throw new Error('An error occurred');
        }
      }

      throw new Error('An error occurred');
    }
  }

  static async register(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (displayName) await updateProfile(result.user, { displayName });

      return result;
    } catch (e: unknown) {
      if (e instanceof FirebaseError) {
        switch (e.code) {
          case 'auth/email-already-in-use':
            throw new Error('Email is already in use');
          case 'auth/invalid-email':
            throw new Error('Email is invalid');
          case 'auth/operation-not-allowed':
            throw new Error('Internal error');
          case 'auth/weak-password':
            throw new Error('Password is too weak');
          default:
            throw new Error('An error occurred');
        }
      }

      throw new Error('An error occurred');
    }
  }
}
