import { UserRole } from '@src/auth/enum/user-role.enum';
import type { CustomClaims, User } from '@src/common/type/firebase-auth.type';
import { generateRandomEmail } from '@src/common/utils/random.util';
import type { FirebaseService } from '@src/firebase/firebase.service';
import type { Profile } from '@src/profile/entity/profile.entity';

import { FirestoreCollection } from '../enum/firestore-collection.enum';
import type { TestUser } from '../type/entity.type';

export async function createTestUserAndToken(
  firebaseService: FirebaseService,
  role: UserRole,
  uid?: string,
): Promise<TestUser> {
  const user = (await firebaseService.auth.createUser({
    uid,
    email: generateRandomEmail(),
    password: 'password',
  })) as User;

  // simulate functions
  const customClaims: CustomClaims = { role: [role] };
  await firebaseService.auth.setCustomUserClaims(user.uid, customClaims);

  const createUserQuery = firebaseService.buildCreateQuery<Profile>(
    { uid: user.uid, email: user.email },
    { timestamps: true },
  );

  await firebaseService.firestore
    .collection(FirestoreCollection.PROFILE)
    .doc(user.uid)
    .set(createUserQuery);

  const customToken = await firebaseService.auth.createCustomToken(user.uid);
  const token: string = await fetch(
    'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  )
    .then((res) => res.json())
    .then((data) => data.idToken);

  return { ...user, token, customClaims } as TestUser;
}

export async function createAthleteUserAndToken(
  firebaseService: FirebaseService,
  uid?: string,
) {
  return await createTestUserAndToken(firebaseService, UserRole.ATHLETE, uid);
}

export async function createTrainerUserAndToken(
  firebaseService: FirebaseService,
  uid?: string,
) {
  return await createTestUserAndToken(firebaseService, UserRole.TRAINER, uid);
}

export async function createManagerUserAndToken(
  firebaseService: FirebaseService,
  uid?: string,
) {
  return await createTestUserAndToken(firebaseService, UserRole.MANAGER, uid);
}

export async function createAdminUserAndToken(
  firebaseService: FirebaseService,
  uid?: string,
) {
  return await createTestUserAndToken(firebaseService, UserRole.ADMIN, uid);
}

export async function deleteTestUser(
  firebaseService: FirebaseService,
  uid: string,
) {
  await firebaseService.auth.deleteUser(uid);
}
