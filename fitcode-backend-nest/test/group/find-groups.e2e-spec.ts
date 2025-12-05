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
    await db.institutions.deleteTest(institution1.id);
    await db.institutions.deleteTest(institution2.id);
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, institutionId: string) {
    return await testApp.http.get(`/institution/${institutionId}/group`, token);
  }

  it('should return all institution groups correctly', async () => {
    const expected: [string, TestUser, number][] = [
      [institution1.id, trainers1[0], 3], // institution, trainer, count of groups
      [institution1.id, trainers1[1], 3],
      [institution2.id, trainers2[0], 2],
    ];

    for (const [institutionId, user, count] of expected) {
      const res = await req(user.token, institutionId);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(count);
    }
  });
});
