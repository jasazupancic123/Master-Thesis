import { FirebaseError } from 'firebase/app';
import type { Auth, UserCredential } from 'firebase/auth';
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCustomToken,
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

  async signInWithCustomToken(token: string): Promise<UserCredential> {
    try {
      return await signInWithCustomToken(this.auth, token);
    } catch (e: unknown) {
      if (e instanceof FirebaseError) {
        switch (e.code) {
          case 'auth/invalid-custom-token':
          case 'auth/custom-token-mismatch':
            throw new Error('Invalid token');
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

  async sendPasswordResetEmail(email: string): Promise<void> {
    return await sendPasswordResetEmail(this.auth, email);
  }

  async confirmPasswordReset(
    oobCode: string,
    newPassword: string
  ): Promise<void> {
    try {
      await confirmPasswordReset(this.auth, oobCode, newPassword);
    } catch (e: unknown) {
      if (e instanceof FirebaseError) {
        switch (e.code) {
          case 'auth/expired-action-code':
            throw new Error('The password reset code has expired');
          case 'auth/invalid-action-code':
            throw new Error('The password reset code is invalid');
          case 'auth/user-disabled':
          case 'auth/user-not-found':
            throw new Error('User not found');
          case 'auth/weak-password':
            throw new Error('The new password is too weak');
          default:
            throw new Error('An error occurred');
        }
      }

      throw new Error('An error occurred');
    }
  }
}
