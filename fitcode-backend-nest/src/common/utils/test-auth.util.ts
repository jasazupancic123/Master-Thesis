import { UserRole } from '@src/auth/enum/user-role.enum';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import type { TestUser } from '@src/common/type/entity.type';
import type { CustomClaims, User } from '@src/common/type/firebase-auth.type';
import { generateRandomEmail } from '@src/common/utils/random.util';
import type { FirebaseService } from '@src/firebase/firebase.service';
import type { Profile } from '@src/profile/entity/profile.entity';

export class TestAuth {
  constructor(private readonly firebase: FirebaseService) {}

  async createSessionCookie(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    return await this.firebase.auth.createSessionCookie(idToken, { expiresIn });
  }

  async createUser(role: UserRole, uid?: string): Promise<TestUser> {
    const user = (await this.firebase.auth.createUser({
      uid,
      email: generateRandomEmail(),
      password: 'password',
    })) as User;

    // simulate functions
    const customClaims: CustomClaims = { role: [role] };
    await this.firebase.auth.setCustomUserClaims(user.uid, customClaims);

    const createUserQuery = this.firebase.buildCreateQuery<Profile>(
      { uid: user.uid, email: user.email, height: 0, weight: 0 },
      { timestamps: true },
    );

    await this.firebase.firestore
      .collection(FirestoreCollection.PROFILE)
      .doc(user.uid)
      .set(createUserQuery);

    const customToken = await this.firebase.auth.createCustomToken(user.uid);
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

  async createAthlete(uid?: string) {
    return await this.createUser(UserRole.ATHLETE, uid);
  }

  async createTrainer(uid?: string) {
    return await this.createUser(UserRole.TRAINER, uid);
  }

  async createManager(uid?: string) {
    return await this.createUser(UserRole.MANAGER, uid);
  }

  async createAdmin(uid?: string) {
    return await this.createUser(UserRole.ADMIN, uid);
  }

  async deleteUser(uid: string) {
    await this.firebase.auth.deleteUser(uid);
    await this.firebase.firestore
      .collection(FirestoreCollection.PROFILE)
      .doc(uid)
      .delete();
  }

  async deleteUsers(uids: string[]) {
    for (const uid of uids) await this.deleteUser(uid);
  }
}
