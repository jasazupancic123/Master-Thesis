import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { UserImportResult } from 'firebase-admin/auth';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { UserRole } from '@src/auth/enum/user-role.enum';
import { deleteUsersByIds } from '@src/common/utils/data.util';
import { FirebaseService } from '@src/firebase/firebase.service';
import type {
  ImportProfileDto,
  ImportProfilesDto,
} from '@src/profile/dto/import-profiles.dto';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Import Users (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let db: TestDbService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);
  });

  afterAll(async () => {
    await db.clear();
    await app.close();
  });

  async function req(token: string, input: ImportProfileDto[]) {
    return await request(app.getHttpServer())
      .post('/profile/import')
      .set('Authorization', `Bearer ${token}`)
      .send({ profiles: input } as ImportProfilesDto);
  }

  it.each([
    ['trainer', global.trainer.token],
    ['athlete', global.athlete.token],
  ])('should not allow %s to import users', async (_, token) => {
    const result = await req(token, [
      {
        uid: '1',
        email: 'test@mail.com',
        displayName: 'Test',
        password: 'password',
        role: UserRole.ATHLETE,
      },
    ]);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Forbidden resource');

    await deleteUsersByIds(firebase, ['1']);
  });

  it('should fail if some role is invalid', async () => {
    const result = await req(global.manager.token, [
      {
        uid: '1',
        email: 'test@mail.com',
        displayName: 'Test',
        password: 'password',
        role: UserRole.MANAGER, // invalid role
      },
    ]);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Invalid role');

    await deleteUsersByIds(firebase, ['1']);
  });

  it('should create profiles only for users that were successfully imported', async () => {
    const result = await req(
      global.manager.token,
      Array.from({ length: 10 }).map((_, i) => ({
        uid: `${i + 1}`,
        email: i % 2 === 0 ? `test${i + 1}@mail.com` : `invalid`, // invalid email
        displayName: `Test ${i + 1}`,
        password: 'password',
        role: UserRole.ATHLETE,
      })),
    );

    expect(result.status).toBe(201);
    const body = result.body as UserImportResult;
    expect(body.successCount).toBe(5);
    expect(body.failureCount).toBe(5);
    expect(body.errors).toHaveLength(5);

    // there should be 5 auth users created and 5 profiles
    const authUsers = await firebase.auth.listUsers();
    for (let i = 0; i < 10; i++) {
      const authUser = authUsers.users.find((u) => u.uid === `${i + 1}`);
      const profile = await db.profiles.findById(`${i + 1}`);

      if (i % 2 === 0) {
        expect(authUser.uid).toBe(`${i + 1}`);
        expect(authUser.email).toBe(`test${i + 1}@mail.com`);
        expect(profile.id).toBe(`${i + 1}`);
      } else {
        expect(authUser).toBeUndefined();
        expect(profile).toBeNull();
      }
    }

    await deleteUsersByIds(
      firebase,
      Array.from({ length: 10 })
        .map((_, i) => `${i + 1}`)
        .filter((_, i) => i % 2 === 0),
    );
  });

  it('should successfully import users', async () => {
    const result = await req(
      global.manager.token,
      Array.from({ length: 50 }).map((_, i) => ({
        uid: `${i + 1}`,
        email: `test${i + 1}@mail.com`,
        displayName: `Test ${i + 1}`,
        password: 'password',
        role: UserRole.ATHLETE,
      })),
    );

    expect(result.status).toBe(201);
    const body = result.body as UserImportResult;
    expect(body.successCount).toBe(50);
    expect(body.failureCount).toBe(0);
    expect(body.errors).toHaveLength(0);

    const allUsers = await firebase.auth.listUsers();
    const allProfiles = (await db.profiles.findAll()).filter((p) =>
      Array.from({ length: 50 })
        .map((_, i) => `${i + 1}`)
        .includes(p.id),
    );

    const importedUsers = allUsers.users.filter((u) =>
      Array.from({ length: 50 })
        .map((_, i) => `${i + 1}`)
        .includes(u.uid),
    );

    expect(allProfiles).toHaveLength(50);
    expect(importedUsers).toHaveLength(50);

    await deleteUsersByIds(
      firebase,
      Array.from({ length: 50 }).map((_, i) => `${i + 1}`),
    );
  });

  it('should not throw error if users already exist', async () => {
    // first import
    let result = await req(
      global.manager.token,
      Array.from({ length: 10 }).map((_, i) => ({
        uid: `${i + 1}`,
        email: `test${i + 1}@mail.com`,
        displayName: `Test ${i + 1}`,
        password: 'password',
        role: UserRole.ATHLETE,
      })),
    );

    expect(result.status).toBe(201);

    // second import
    result = await req(
      global.manager.token,
      Array.from({ length: 10 }).map((_, i) => ({
        uid: `${i + 1}`,
        email: `test${i + 1}@mail.com`,
        displayName: `Test ${i + 1}`,
        password: 'password',
        role: UserRole.ATHLETE,
      })),
    );

    expect(result.status).toBe(201);

    const allUsers = await firebase.auth.listUsers();
    const allProfiles = (await db.profiles.findAll()).filter((p) =>
      Array.from({ length: 10 })
        .map((_, i) => `${i + 1}`)
        .includes(p.id),
    );

    const importedUsers = allUsers.users.filter((u) =>
      Array.from({ length: 10 })
        .map((_, i) => `${i + 1}`)
        .includes(u.uid),
    );

    expect(allProfiles).toHaveLength(10);
    expect(importedUsers).toHaveLength(10);

    await deleteUsersByIds(
      firebase,
      Array.from({ length: 10 }).map((_, i) => `${i + 1}`),
    );
  });
});
