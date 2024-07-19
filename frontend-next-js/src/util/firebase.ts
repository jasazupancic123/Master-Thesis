import {signInWithEmailAndPassword, updateProfile, UserCredential, createUserWithEmailAndPassword} from 'firebase/auth'
import {auth} from '@/config/firebase.config'
import {FirebaseError} from 'firebase/app'
import { Cycle, Week } from '@/type/cycle.type';
import dayjs, { Dayjs } from 'dayjs';
import { isDateBetween } from '@/util/date';

export class FirebaseAuthService {
    static async login(email: string, password: string): Promise<UserCredential> {
        try {
            return await signInWithEmailAndPassword(auth, email, password)
        } catch (e) {
            if (e instanceof FirebaseError) {
                switch (e.code) {
                    case 'auth/invalid-credential':
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-email':
                    case 'auth/weak-password':
                        throw new Error('Email or password is incorrect')
                    case 'auth/app-deleted':
                    case 'auth/app-not-authorized':
                    case 'auth/argument-error':
                    case 'auth/invalid-api-key':
                    case 'auth/operation-not-allowed':
                        throw new Error('Internal error')
                    default:
                        throw new Error('An error occurred')
                }
            }
        }
    }

    static async register(email: string, password: string, displayName?: string): Promise<UserCredential> {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password)
            if (displayName)
                await updateProfile(result.user, {displayName})

            return result
        } catch (e) {
            if (e instanceof FirebaseError) {
                switch (e.code) {
                    case 'auth/email-already-in-use':
                        throw new Error('Email is already in use')
                    case 'auth/invalid-email':
                        throw new Error('Email is invalid')
                    case 'auth/operation-not-allowed':
                        throw new Error('Internal error')
                    case 'auth/weak-password':
                        throw new Error('Password is too weak')
                    default:
                        throw new Error('An error occurred')
                }
            }
        }
    }
}

export class Firestore {
    static populate<T>(item: T): T {
        if (this.isCycle(item)) {
            // assign random color to cycle
            item.color = Math.floor(Math.random() * 16777215).toString(16);

            // convert startDate and endDate to dayjs
            item.startDate = dayjs(item.startDate);
            item.endDate = dayjs(item.endDate);

            // create array of weeks, each containing array of 7 days, where first day is Monday
            const weeks: Week[][] = [];
            const startDateWeekStart = dayjs(item.startDate).startOf('week').add(1, 'day');
            const endDateWeekEnd = dayjs(item.endDate).endOf('week').add(1, 'day');
            const totalDays = endDateWeekEnd.diff(startDateWeekStart, 'day') + 1
            const totalWeeks = Math.ceil(totalDays / 7)

            let date = startDateWeekStart;
            for (let i = 0; i < totalWeeks; i++) {
                const week: Week[] = Array(7).fill(null);
                for (let day = 0; day < 7; day++) {
                    week[day] = { date, trainings: [] };
                    date = date.add(1, 'day');
                }

                weeks.push(week);
            }

            item.weeks = weeks;

            item.isInRange = (date: Dayjs) => isDateBetween(date, item.startDate, item.endDate)
        }

        return item;
    }

    private static isCycle(data: any): data is Cycle {
        return data.id && data.groupId && data.name && data.startDate && data.endDate
    }
}