// NOTE - this has to be default import: https://github.com/firebase/firebase-admin-node/issues/593#issuecomment-620711067
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { auth } from 'firebase-functions/v1';

const isDev = process.env.NODE_ENV === 'dev';
admin.initializeApp({ credential: admin.credential.applicationDefault() });

/* Create custom user claims per registration and new user entry in
the database */
export const createUserRole = auth.user().onCreate(async (user) => {
  const role =
    isDev && user.email === 'admin@mail.com'
      ? 'admin'
      : isDev && user.email === 'manager@mail.com'
        ? 'manager'
        : isDev && user.email === 'trainer@mail.com'
          ? 'trainer'
          : 'athlete';

  await getAuth().setCustomUserClaims(user.uid, { role: [role] });
  await getFirestore()
    .collection('users')
    .doc(user.uid)
    .set({
      id: user.uid,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      deletedAt: null,
      groupsIds: [],
      trainersIds: [],
    });
});
