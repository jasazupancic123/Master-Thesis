import { TestApp } from '@test/common/utils/app.util';

import type { AuthUser } from '@src/auth/entity/auth-user.entity';
import { UserRole } from '@src/auth/enum/user-role.enum';
import type { ValidateRowError } from '@src/common/type/validate.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { TestDbService } from '@src/test-db/test-db.service';
import type {
  ImportUserDto,
  ImportUsersDto,
} from '@src/user/dto/import-users.dto';
import { UserService } from '@src/user/service/user.service';

describe('Import Users (e2e)', () => {
  let testApp: TestApp;
  let firebase: FirebaseService;
  let db: TestDbService;
  let userService: UserService;

  let institutionId: string;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    firebase = testApp.module.get(FirebaseService);
    userService = testApp.module.get(UserService);
    institutionId = (await db.institutions.createTest()).id;
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, input: ImportUserDto[]) {
    return await testApp.http.post('/user/import', token, {
      users: input,
    } as ImportUsersDto);
  }

  it.each([
    ['trainer', global.trainer.token],
    ['athlete', global.athlete.token],
  ])('should not allow %s to import users', async (_, token) => {
    const result = await req(token, [
      {
        email: 'test@mail.com',
        displayName: 'Test',
        password: 'password',
        role: UserRole.ATHLETE,
      },
    ]);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Forbidden resource');
  });

  it('should fail if some role is invalid', async () => {
    const result = await req(global.manager.token, [
      {
        email: 'test@mail.com',
        displayName: 'Test',
        password: 'password',
        role: UserRole.MANAGER, // invalid role
      },
    ]);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Invalid role');
  });

  it('should create profiles only for users that were successfully imported', async () => {
    const allProfilesBefore = await db.profiles.findAll();
    expect(allProfilesBefore).toHaveLength(4); // global test profiles

    const spy = jest.spyOn(userService, 'importUsers');
    const result = await req(
      global.manager.token,
      Array.from({ length: 10 }).map((_, i) => ({
        email: i % 2 === 0 ? `test${i + 1}@mail.com` : `invalid`, // invalid email
        displayName: `Test ${i + 1}`,
        password: 'password',
        role: UserRole.ATHLETE,
      })),
    );

    expect(result.status).toBe(201);
    expect(spy).toHaveBeenCalledTimes(1);

    const spyResult = (await spy.mock.results[0].value) as {
      successful: AuthUser[];
      errors: ValidateRowError[];
    };

    expect(spyResult.successful).toHaveLength(5);
    expect(spyResult.errors).toHaveLength(5);
    spyResult.errors.forEach((e) => {
      expect(e.errors[0].message).toBe(
        'The email address is improperly formatted.',
      );
    });

    spy.mockRestore();

    // it should add members to institution
    let institution = await db.institutions.findById(institutionId);
    const athleteIds = institution.members
      .filter((m) => m.role === UserRole.ATHLETE)
      .map((m) => m.id);

    expect(athleteIds).toHaveLength(5 + 1); // +1 for global.athlete

    const allProfilesAfter = await db.profiles.findAll();
    expect(allProfilesAfter).toHaveLength(9); // 4 + 5 new

    // delete users
    const allUsers = await firebase.auth.listUsers();
    await testApp.auth.deleteUsers(
      allUsers.users
        .filter((u) => u.email?.startsWith('test') ?? false)
        .map((u) => u.uid),
    );

    for (const uid of athleteIds)
      if (uid !== global.athlete.uid)
        await db.institutions.members.removeMember(
          { institutionId, uid },
          UserRole.ATHLETE,
        );
  });

  it('should successfully import all users', async () => {
    const allProfilesBefore = await db.profiles.findAll();
    expect(allProfilesBefore).toHaveLength(4); // global test profiles

    let institution = await db.institutions.findById(institutionId);
    let athleteIds = institution.members
      .filter((m) => m.role === UserRole.ATHLETE)
      .map((m) => m.id);

    expect(athleteIds).toHaveLength(1); // only global.athlete

    const spy = jest.spyOn(userService, 'importUsers');
    const result = await req(
      global.manager.token,
      Array.from({ length: 50 }).map((_, i) => ({
        email: `test${i + 1}@mail.com`,
        displayName: `Test ${i + 1}`,
        password: 'password',
        role: UserRole.ATHLETE,
      })),
    );

    expect(result.status).toBe(201);
    expect(spy).toHaveBeenCalledTimes(1);

    const spyResult = (await spy.mock.results[0].value) as {
      successful: AuthUser[];
      errors: ValidateRowError[];
    };

    expect(spyResult.successful).toHaveLength(50);
    expect(spyResult.errors).toHaveLength(0);
    spy.mockRestore();

    // it should add members to institution
    institution = await db.institutions.findById(institutionId);
    athleteIds = institution.members
      .filter((m) => m.role === UserRole.ATHLETE)
      .map((m) => m.id);

    expect(athleteIds).toHaveLength(50 + 1); // +1 for global.athlete

    const allProfilesAfter = await db.profiles.findAll();
    expect(allProfilesAfter).toHaveLength(54); // 4 + 50 new

    // delete users
    const allUsers = await firebase.auth.listUsers();
    await testApp.auth.deleteUsers(
      allUsers.users
        .filter((u) => u.email?.startsWith('test') ?? false)
        .map((u) => u.uid),
    );

    for (const uid of athleteIds)
      if (uid !== global.athlete.uid)
        await db.institutions.members.removeMember(
          { institutionId, uid },
          UserRole.ATHLETE,
        );
  });

  it('should not throw error if users already exist', async () => {
    const allProfilesBefore = await db.profiles.findAll();
    expect(allProfilesBefore).toHaveLength(4); // global test profiles

    // first import
    let result = await req(
      global.manager.token,
      Array.from({ length: 10 }).map((_, i) => ({
        email: `test${i + 1}@mail.com`,
        displayName: `Test ${i + 1}`,
        password: 'password',
        role: UserRole.ATHLETE,
      })),
    );

    expect(result.status).toBe(201);
    let body = result.body as {
      successful: AuthUser[];
      errors: ValidateRowError[];
    };

    expect(body.successful).toHaveLength(10);
    expect(body.errors).toHaveLength(0);

    let institution = await db.institutions.findById(institutionId);
    let athleteIds = institution.members
      .filter((m) => m.role === UserRole.ATHLETE)
      .map((m) => m.id);

    expect(athleteIds).toHaveLength(10 + 1); // +1 for global.athlete

    const allProfilesAfterFirst = await db.profiles.findAll();
    expect(allProfilesAfterFirst).toHaveLength(14); // 4 + 10 new

    // second import
    result = await req(
      global.manager.token,
      Array.from({ length: 10 }).map((_, i) => ({
        email: `test${i + 1}@mail.com`,
        displayName: `Test ${i + 1}`,
        password: 'password',
        role: UserRole.ATHLETE,
      })),
    );

    expect(result.status).toBe(201);
    body = result.body;

    expect(body.successful).toHaveLength(0);
    expect(body.errors).toHaveLength(10);
    body.errors.forEach((f) => {
      expect(f.errors[0].field).toMatch(/test\d+@mail\.com/);
      expect(f.errors[0].message).toContain('already');
    });

    institution = await db.institutions.findById(institutionId);
    athleteIds = institution.members
      .filter((m) => m.role === UserRole.ATHLETE)
      .map((m) => m.id);

    expect(athleteIds).toHaveLength(10 + 1); // +1 for global.athlete

    const allProfilesAfterSecond = await db.profiles.findAll();
    expect(allProfilesAfterSecond).toHaveLength(14); // no new profiles

    // delete users
    const allUsers = await firebase.auth.listUsers();
    await testApp.auth.deleteUsers(
      allUsers.users
        .filter((u) => u.email?.startsWith('test') ?? false)
        .map((u) => u.uid),
    );

    await db.institutions.update(institutionId, {
      members: [
        { id: global.athlete.uid, role: UserRole.ATHLETE },
        { id: global.trainer.uid, role: UserRole.TRAINER },
      ],
    });
  });

  it('should import athletes and trainers', async () => {
    const result = await req(global.manager.token, [
      {
        email: `trainer@mail.com`,
        displayName: `Trainer`,
        password: 'password',
        role: UserRole.TRAINER,
      },
      {
        email: `athlete@mail.com`,
        displayName: `Athlete`,
        password: 'password',
        role: UserRole.ATHLETE,
      },
    ]);

    expect(result.status).toBe(201);
    const body = result.body as {
      successful: AuthUser[];
      errors: ValidateRowError[];
    };

    expect(body.successful).toHaveLength(2);
    expect(body.errors).toHaveLength(0);

    const institution = await db.institutions.findById(institutionId);

    let trainerIds = institution.members
      .filter((m) => m.role === UserRole.TRAINER)
      .map((m) => m.id);

    let athleteIds = institution.members
      .filter((m) => m.role === UserRole.ATHLETE)
      .map((m) => m.id);

    expect(trainerIds).toContain(
      body.successful.find((u) => u.email === 'trainer@mail.com')!.uid,
    );

    expect(athleteIds).toContain(
      body.successful.find((u) => u.email === 'athlete@mail.com')!.uid,
    );

    // delete users
    const allUsers = await firebase.auth.listUsers();
    await testApp.auth.deleteUsers(
      allUsers.users
        .filter(
          (u) =>
            u.email === 'trainer@mail.com' || u.email === 'athlete@mail.com',
        )
        .map((u) => u.uid),
    );

    await db.institutions.update(institutionId, {
      members: [
        { id: global.athlete.uid, role: UserRole.ATHLETE },
        { id: global.trainer.uid, role: UserRole.TRAINER },
      ],
    });
  });

  it('should import users that already exist in auth but dont belong to institution', async () => {
    // create user beforehand
    const preExistingUser = await testApp.auth.createUser(
      UserRole.ATHLETE,
      'existing-uid',
    );

    const result = await req(global.manager.token, [
      {
        email: preExistingUser.email!,
        displayName: `Existing User`,
        password: 'password',
        role: UserRole.ATHLETE,
      },
      {
        email: `correct@mail.com`,
        displayName: `Correct User`,
        password: 'password',
        role: UserRole.ATHLETE,
      },
    ]);

    expect(result.status).toBe(201);
    const body = result.body as {
      successful: AuthUser[];
      errors: ValidateRowError[];
    };

    expect(body.successful).toHaveLength(2);
    expect(body.errors).toHaveLength(0);

    // delete both users
    await testApp.auth.deleteUsers([
      body.successful[0].uid,
      body.successful[1].uid,
    ]);
  });
});
