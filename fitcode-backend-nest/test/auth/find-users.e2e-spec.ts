import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution, TestUser } from '@src/common/type/entity.type';
import { createAthleteUserAndToken } from '@src/common/utils/auth.util';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Update Institution (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let newAthlete1: TestUser;
  let newAthlete2: TestUser;

  let institution1: TestInstitution;
  let institution2: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    newAthlete1 = await createAthleteUserAndToken(testApp.firebase);
    newAthlete2 = await createAthleteUserAndToken(testApp.firebase);

    // first institution has 3 global users (manager & trainer & athlete) + 1 additional athlete
    institution1 = await db.institutions.createTest({
      athletes: [global.athlete, newAthlete2],
    });

    // second institution has 1 created manager, 1 created trainer, 1 created athlete + 2 additional athletes (one of them is shared with institution 1)
    institution2 = await db.institutions.createTest({
      random: true,
      athletes: [newAthlete1, newAthlete2],
    });
  });

  afterAll(async () => {
    await db.institutions.remove(institution1.id);
    await db.institutions.remove(institution2.id);
    await db.cleanup();
    await testApp.close();
  });

  async function req(token: string) {
    return await testApp.http.get('/auth', token);
  }

  it.each([
    ['admin', 9, global.admin.token], // all users + admin
    ['manager', 4, global.manager.token], // only institution1
    ['trainer', 4, global.trainer.token],
    ['athlete', 4, global.athlete.token],
  ])('should get all users for %s', async (role, expectedLength, token) => {
    const response = await req(token);
    expect(response.status).toBe(200);

    if (role === 'admin')
      // sometimes, there can be more users (from other tests), so just check minimum
      expect(response.body.length).toBeGreaterThanOrEqual(expectedLength);
    else expect(response.body.length).toEqual(expectedLength);
  });

  // for institution 2, manual tests must be written since jest's it.each doesn't work
  it('should get all users for manager of institution 2', async () => {
    const response = await req(institution2.manager.token);
    expect(response.status).toBe(200);
    expect(response.body.length).toEqual(5); // only institution2
  });

  it('should get all users for trainer of institution 2', async () => {
    const response = await req(institution2.trainers[0].token);
    expect(response.status).toBe(200);
    expect(response.body.length).toEqual(5);
  });

  it('should get all users for athlete of institution 2', async () => {
    const response = await req(newAthlete1.token);
    expect(response.status).toBe(200);
    expect(response.body.length).toEqual(5);
  });

  it('should get all users for new athlete 1 (only 1st institution)', async () => {
    const response = await req(newAthlete1.token);
    expect(response.status).toBe(200);
    expect(response.body.length).toEqual(5);
  });

  it('should get all users for new athlete 2 (both institutions)', async () => {
    const response = await req(newAthlete2.token);
    expect(response.status).toBe(200);
    expect(response.body.length).toEqual(8); // 4 - 1 (himself) in first + 5 - 1 (himself) in second + himself
  });
});
