import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { auth } from '@/config/firebase.config';
import { FirebaseError } from 'firebase/app';
import { Cycle } from '@/type/cycle.type';
import dayjs from 'dayjs';
import { Training } from '@/type/training.type';
import { Component } from '@/type/component.type';
import { UserRole } from '@/enum/user-role.enum';

export const isAdmin = (role: UserRole[]) => role.includes(UserRole.ADMIN);
export const isManager = (role: UserRole[]) => role.includes(UserRole.MANAGER);
export const isTrainer = (role: UserRole[]) => role.includes(UserRole.TRAINER);
export const isAthlete = (role: UserRole[]) => role.includes(UserRole.ATHLETE);

export class FirebaseAuthService {
  static async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
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
    }
  }

  static async register(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName)
        await updateProfile(result.user, { displayName });

      return result;
    } catch (e) {
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
    }
  }
}

export class Firestore {
  static populateCycle(item: Cycle): Cycle {
    // assign random color to cycle
    item.color = Math.floor(Math.random() * 16777215).toString(16);

    // convert startDate and endDate to dayjs
    item.startDate = dayjs(item.startDate);
    item.endDate = dayjs(item.endDate);

    return item;
  }

  static populateTraining(item: Training, components: Component[]): Training {
    // convert dates to dayjs
    item.startTime = dayjs(item.startTime);
    item.endTime = dayjs(item.endTime);

    // if set groups are defined, map components to set groups
    item.setGroups = item.setGroups?.map((setGroup) => {
      setGroup.component = components.find((c) => c.id === setGroup.componentId);
      return setGroup;
    });

    return item;
  }
}