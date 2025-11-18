import { TestApp } from '@test/common/utils/app.util';

import { FirebaseService } from '@src/firebase/firebase.service';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { ProfileService } from '@src/profile/service/profile.service';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Find Profiles (e2e)', () => {
  let testApp: TestApp;
  let firebase: FirebaseService;
  let profileService: ProfileService;
  let db: TestDbService;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    firebase = testApp.module.get(FirebaseService);
    profileService = testApp.module.get(ProfileService);
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  it('should return profile by id or create', async () => {
    const user = await firebase.auth.createUser({
      email: 'test1@mail.com',
      displayName: 'Test 1',
      password: 'password',
    });

    const profile = await profileService.findOneById(user.uid);
    expect(profile).toBeDefined();
    expect(profile.uid).toBe(user.uid);
    expect(profile.email).toBe(user.email);

    await testApp.auth.deleteUsers([user.uid]);
  });

  it('should return all institution profiles even if some do not exist', async () => {
    // create 10 auth users
    const users = await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        firebase.auth.createUser({
          uid: `${i + 1}`,
          email: `test${i + 1}@mail.com`,
          displayName: `Test ${i + 1}`,
          password: 'password',
        }),
      ),
    );

    // create only 5 profiles
    const profileIds = await Promise.all(
      users
        .filter((_, i) => i < 5)
        .map((user) =>
          db.profiles.save({
            uid: user.uid,
            email: user.email,
            height: 0,
            weight: 0,
          }),
        ),
    );

    const profilesBefore = (await db.profiles.findAll()).filter((p) =>
      profileIds.includes(p.uid),
    );

    expect(profilesBefore).toHaveLength(5);

    // should return 10 profiles, since profiles should be created on the fly
    const profiles = await profileService.findAllByInstitution(
      generateInstitutionStub({
        ownerId: users[0].uid,
        trainerIds: users.slice(1, 5).map((u) => u.uid),
        athleteIds: users.slice(5).map((u) => u.uid),
      }),
    );

    expect(profiles).toHaveLength(10);

    await testApp.auth.deleteUsers(users.map((u) => u.uid));
  });
});
