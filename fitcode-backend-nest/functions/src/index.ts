/* eslint-disable indent */
// NOTE - this has to be default import: https://github.com/firebase/firebase-admin-node/issues/593#issuecomment-620711067
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { https } from 'firebase-functions/v1';

admin.initializeApp({ credential: admin.credential.applicationDefault() });

const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TRAINER: 'trainer',
  ATHLETE: 'athlete',
};

const Collection = {
  USERS: 'users',
  INSTITUTIONS: 'institutions',
};

export const createUserWithRole = https.onCall(async (data, context) => {
  // validate fields
  const { displayName, email, password, role: requesteeRole } = data;
  if (!displayName || !email || !password || !requesteeRole) {
    throw new https.HttpsError('invalid-argument', 'Missing user details.');
  }

  try {
    // authentication
    if (!context.auth) {
      // register user
      const newUser = await admin
        .auth()
        .createUser({ displayName, email, password });

      await admin
        .auth()
        .setCustomUserClaims(newUser.uid, { role: [UserRole.ATHLETE] });

      await admin
        .firestore()
        .collection(Collection.USERS)
        .doc(newUser.uid)
        .set({
          id: newUser.uid,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          deletedAt: null,
          groupsIds: [],
          trainersIds: [],
        });

      return newUser;
    }

    // authorization
    const requesterUid = context.auth.uid;
    const requesterClaims =
      (await admin.auth().getUser(requesterUid)).customClaims || {};

    const requesterRole = requesterClaims.role?.[0];
    switch (requesterRole) {
      case UserRole.ADMIN:
        if (requesteeRole !== UserRole.MANAGER) {
          throw new https.HttpsError(
            'permission-denied',
            'You can only register managers majstore.',
          );
        }

        break;
      case UserRole.MANAGER:
        if (![UserRole.TRAINER, UserRole.ATHLETE].includes(requesteeRole)) {
          throw new https.HttpsError(
            'permission-denied',
            'You can only register trainers and athletes.',
          );
        }

        break;
      default:
        throw new https.HttpsError(
          'permission-denied',
          'You are not allowed to perform this action.',
        );
    }

    const allRoles = [UserRole.MANAGER, UserRole.TRAINER, UserRole.ATHLETE];
    if (!allRoles.includes(requesteeRole)) {
      throw new https.HttpsError('invalid-argument', 'Invalid user role.');
    }

    const newUser = await admin
      .auth()
      .createUser({ displayName, email, password });

    await admin
      .auth()
      .setCustomUserClaims(newUser.uid, { role: [requesteeRole] });

    let institutionId: string | null = null;
    if (requesterRole === UserRole.MANAGER) {
      // add requestee to manager's institution
      institutionId = (
        await admin
          .firestore()
          .collection(Collection.INSTITUTIONS)
          .where('ownerId', '==', requesterUid)
          .get()
      ).docs?.[0]?.id;

      // add user to institution
      await admin
        .firestore()
        .collection(Collection.INSTITUTIONS)
        .doc(institutionId)
        .update(
          requesteeRole === UserRole.TRAINER ? 'trainerIds' : 'athleteIds',
          FieldValue.arrayUnion(newUser.uid),
        );
    }

    await admin
      .firestore()
      .collection(Collection.USERS)
      .doc(newUser.uid)
      .set({
        id: newUser.uid,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        deletedAt: null,
        groupsIds: [],
        trainersIds: [],
        institutionIds: institutionId ? [institutionId] : [],
      });

    return newUser;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e.code && e.code.includes('auth/')) {
      throw new https.HttpsError('invalid-argument', e.message, {
        originalCode: e.code,
      });
    }

    throw e;
  }
});
