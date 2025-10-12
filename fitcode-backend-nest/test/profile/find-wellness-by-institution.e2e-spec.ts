import { TestApp } from '@test/common/utils/app.util';
import { subDays } from 'date-fns';

import type { TestInstitution } from '@src/common/type/entity.type';
import {
  createAthleteUserAndToken,
  createTrainerUserAndToken,
} from '@src/common/utils/auth.util';
import { deleteUsersByIds } from '@src/common/utils/data.util';
import type { FirebaseService } from '@src/firebase/firebase.service';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Find Wellness By Institution (e2e)', () => {
  let testApp: TestApp;
  let testDb: TestDbService;
  let firebase: FirebaseService;
  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    firebase = testApp.firebase;
    testDb = testApp.app.get(TestDbService);

    const testAthletes = await Promise.all(
      Array.from({ length: 50 }).map((_, i) =>
        createAthleteUserAndToken(firebase, i.toString()),
      ),
    );

    institution = await testDb.institutions.createTest({
      athletes: testAthletes,
    });
  });

  afterAll(async () => {
    await testDb.institutions.remove(institution.id);
    await testDb.clear();
    await testApp.close();
  });

  async function req(token: string) {
    return await testApp.http.get(
      `/profile/wellness/institution/${institution.id}`,
      token,
    );
  }

  it('institution should have 50 athletes', () => {
    expect(institution.athleteIds.length).toBe(50);
  });

  it('should fail if user is athlete', async () => {
    const res = await req(institution.athletes[0].token);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden resource');
  });

  it('should fail if user is trainer that is not in this institution', async () => {
    const otherTrainer = await createTrainerUserAndToken(firebase);
    const res = await req(otherTrainer.token);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized');

    await deleteUsersByIds(firebase, [otherTrainer.uid]);
  });

  it('should find all wellnesses for members by institution', async () => {
    const wellnessesIds: string[] = [];
    for (let i = 0; i < 50; i++)
      for (let j = 0; j < 20; j++)
        wellnessesIds.push(
          await testDb.wellness.save(
            { soreness: Math.random() * 10, sleep: 8, fatigue: 3 },
            {
              date: subDays(new Date(), j + 1),
              uid: institution.athletes[i].uid,
            },
          ),
        );

    expect(wellnessesIds).toHaveLength(1000);

    const res = await req(institution.trainers[0].token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(500); // should return 10 wellness (the latest) for each athlete

    await testDb.wellness.clear();
  });
});
