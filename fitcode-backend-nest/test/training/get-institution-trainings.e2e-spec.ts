import { TestApp } from '@test/common/utils/app.util';
import { addDays, subDays } from 'date-fns';

import { getTime } from '@src/common/service/util';
import type { TestInstitution } from '@src/common/type/entity.type';
import { TestDbService } from '@src/test-db/test-db.service';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Get Trainings (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    // institution with 2 trainers (one is global.trainer)
    institution = await db.institutions.createTest({
      createRandomTrainer: true,
      trainers: [global.trainer],
    });

    const trainingData = {
      institutionId: institution.id,
      ownerId: global.trainer.uid,
      membersIds: [],
    };

    const past = getTime(subDays(new Date(), 2), 8, 0);
    const today = getTime(new Date(), 8, 0);
    const future = getTime(addDays(new Date(), 1), 8, 0);

    await Promise.all([
      // past
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: past,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: past,
        }),
      ),
      // today
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: today,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: today,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[1].uid,
          date: today,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[1].uid,
          date: today,
        }),
      ),
      // future
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[1].uid,
          date: future,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: future,
        }),
      ),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      db.trainings.clear(),
      db.institutions.deleteTest(institution.id),
    ]);

    await testApp.close();
  });

  function req() {
    return testApp.http.get(
      '/training/institution/today',
      global.manager.token,
    );
  }

  it('should return populated trainings for today', async () => {
    const res = await req();
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4); // 2 from each trainer
  });
});
