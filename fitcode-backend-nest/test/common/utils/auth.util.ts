import { UserRole } from '@src/auth/enum/user-role.enum';
import type { CustomClaims, User } from '@src/common/type/firebase-auth.type';
import { generateRandomEmail } from '@src/common/utils/random.util';
import type { FirebaseService } from '@src/firebase/firebase.service';
import type { Profile } from '@src/profile/entity/profile.entity';

import type { TestUser } from '../type/auth.type';

export async function createTestUserAndToken(
  firebaseService: FirebaseService,
  role: UserRole,
): Promise<TestUser> {
  const user = (await firebaseService.auth.createUser({
    email: generateRandomEmail(),
    password: 'password',
  })) as User;

  // simulate functions
  const customClaims: CustomClaims = { role: [role] };
  await firebaseService.auth.setCustomUserClaims(user.uid, customClaims);

  const createUserQuery = firebaseService.buildCreateQuery<Profile>(
    { id: user.uid },
    { timestamps: true },
  );

  await firebaseService.firestore
    .collection('users')
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
) {
  return await createTestUserAndToken(firebaseService, UserRole.ATHLETE);
}

export async function createTrainerUserAndToken(
  firebaseService: FirebaseService,
) {
  return await createTestUserAndToken(firebaseService, UserRole.TRAINER);
}

export async function createManagerUserAndToken(
  firebaseService: FirebaseService,
) {
  return await createTestUserAndToken(firebaseService, UserRole.MANAGER);
}

export async function createAdminUserAndToken(
  firebaseService: FirebaseService,
) {
  return await createTestUserAndToken(firebaseService, UserRole.ADMIN);
}

export async function deleteTestUser(
  firebaseService: FirebaseService,
  uid: string,
) {
  await firebaseService.auth.deleteUser(uid);
}
