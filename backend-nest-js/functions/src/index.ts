import { auth, config } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

admin.initializeApp(config().firebase);

/* Create custom user claims per registration and new user entry in the database */
export const createUserRole = auth.user().onCreate(async (user) => {
  await getAuth().setCustomUserClaims(user.uid, {
    role: ['athlete'],
  });

  await getFirestore().collection('users').doc(user.uid).set({
    id: user.uid,
    level: 'beginner',
    bodyweight: [],
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
  });
});