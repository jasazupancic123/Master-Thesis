import { auth, config } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

admin.initializeApp(config().firebase);

/* Create custom user claims per registration */
export const createUserRole = auth.user().onCreate(async (user) => {
  await getAuth().setCustomUserClaims(user.uid, {
    role: ['athlete'],
    level: 'beginner',
  });
});