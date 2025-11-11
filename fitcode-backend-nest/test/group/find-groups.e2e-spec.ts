import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution, TestUser } from '@src/common/type/entity.type';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Find Groups (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution1: TestInstitution;
  let institution2: TestInstitution;
  let trainers1: TestUser[];
  let trainers2: TestUser[];

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institution1 = await db.institutions.createTest({
      createRandomTrainer: true,
      trainers: [global.trainer],
    });

    institution2 = await db.institutions.createTest({
      createRandomTrainer: true,
    });

    trainers1 = institution1.trainers;
    trainers2 = institution2.trainers;

    // create 3 groups for 1st institution and 2 for 2nd institution
    await Promise.all([
      db.groups.createTest(institution1, { trainerIds: [trainers1[0].uid] }),
      db.groups.createTest(institution1, { trainerIds: [trainers1[1].uid] }),
      db.groups.createTest(institution1, {
        trainerIds: [trainers1[0].uid, trainers1[1].uid],
      }),
      db.groups.createTest(institution2, { trainerIds: [trainers2[0].uid] }),
      db.groups.createTest(institution2, { trainerIds: [trainers2[0].uid] }),
    ]);
  });

  afterAll(async () => {
    await db.institutions.remove(institution1.id);
    await db.institutions.remove(institution2.id);
    await db.clear();
    await testApp.close();
  });

  async function req(token: string) {
    return await testApp.http.get(`/group`, token);
  }

  it('should return all groups for admin', async () => {
    const res = await req(global.admin.token);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
  });

  it('should return all institution groups for trainer', async () => {
    const expected: [TestUser, number][] = [
      [trainers1[0], 3], // trainer, count of groups
      [trainers1[1], 3],
      [trainers2[0], 2],
    ];

    for (const [user, count] of expected) {
      const res = await req(user.token);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(count);
    }
  });

  it('should return all institution groups for manager', async () => {
    const res = await req(global.manager.token); // owns both institutions
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
  });
});
