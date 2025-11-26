import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { SaveWellnessDto } from '@src/profile/dto/save-wellness.dto';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Upsert Wellness (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest();
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, body: SaveWellnessDto) {
    return testApp.http.post(`/profile`, token, body);
  }

  it('should successfully insert wellness', async () => {
    let res = await req(global.athlete.token, {
      date: new Date(),
      sleep: 7,
      fatigue: 3,
    });

    expect(res.status).toBe(201);

    let dbWellness = await db.wellness.findAll((q) => q, {
      uid: global.athlete.uid,
      date: new Date(),
    });

    expect(dbWellness.length).toBe(1);
    expect(dbWellness[0].sleep).toBe(7);
    expect(dbWellness[0].fatigue).toBe(3);
    expect(dbWellness[0].soreness).toBeUndefined();

    // it should update profile's latestWellnessZScore
    let profile = await db.profiles.findById(global.athlete.uid);
    expect(profile).toBeDefined();
    expect(profile.wellness.sleep).toBe(7);
    expect(profile.wellness.fatigue).toBe(3);
    expect(profile.wellness.soreness).toBeUndefined();
    expect(profile.wellness.zScoreSleep).toBe(0);
    expect(profile.wellness.zScoreFatigue).toBe(0);
    expect(profile.wellness.zScoreSoreness).toBe(0);

    // upsert again, profile should be updated
    res = await req(global.athlete.token, {
      date: new Date(),
      sleep: 8,
      soreness: 4,
    });

    expect(res.status).toBe(201);

    dbWellness = await db.wellness.findAll((q) => q, {
      uid: global.athlete.uid,
      date: new Date(),
    });

    expect(dbWellness.length).toBe(1);
    expect(dbWellness[0].sleep).toBe(8);
    expect(dbWellness[0].fatigue).toBeUndefined();
    expect(dbWellness[0].soreness).toBe(4);

    // it should update profile's latestWellnessZScore
    profile = await db.profiles.findById(global.athlete.uid);
    expect(profile).toBeDefined();
    expect(profile.wellness.sleep).toBe(8);
    expect(profile.wellness.fatigue).toBeUndefined();
    expect(profile.wellness.soreness).toBe(4);
    expect(profile.wellness.zScoreSleep).toBe(0);
    expect(profile.wellness.zScoreFatigue).toBe(0);
    expect(profile.wellness.zScoreSoreness).toBe(0);
  });
});
