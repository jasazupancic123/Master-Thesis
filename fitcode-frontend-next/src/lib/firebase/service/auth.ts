import { FirebaseError } from 'firebase/app';
import type { Auth, UserCredential } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import { UserRole } from '@/core/profile/enum/user-role.enum';
import { getFirebaseAuth } from '@/lib/firebase/config';

export class FirebaseAuthUtil {
  private auth: Auth;

  constructor() {
    this.auth = getFirebaseAuth();
  }

  isAdmin(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }

  isManager(role: UserRole): boolean {
    return role === UserRole.MANAGER;
  }

  isTrainer(role: UserRole): boolean {
    return role === UserRole.TRAINER;
  }

  isAthlete(role: UserRole): boolean {
    return role === UserRole.ATHLETE;
  }

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
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

  async register(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(
        this.auth,
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
