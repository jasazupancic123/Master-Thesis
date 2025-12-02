import { subDays } from 'date-fns';

import { TestDbService } from '@src/test-db/test-db.service';
import { TrainingStatus } from '@src/training/enum/training-status.enum';

import { TestApp } from './common/utils/app.util';

describe('AppController (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function initReq(token: string) {
    return await testApp.http.get('/init', token);
  }

  it('should complete past active trainings for athlete', async () => {
    await Promise.all([
      db.trainingComponentUserStatus.createTest(
        'trainingId1',
        'c1',
        global.athlete.uid,
        { status: TrainingStatus.IN_PROGRESS, from: subDays(new Date(), 5) },
      ),
      db.trainingComponentUserStatus.createTest(
        'trainingId2',
        'c1',
        global.athlete.uid,
        { status: TrainingStatus.IN_PROGRESS, from: subDays(new Date(), 2) },
      ),
      db.trainingComponentUserStatus.createTest(
        'trainingId3',
        'c1',
        global.athlete.uid,
        { status: TrainingStatus.IN_PROGRESS, from: new Date() },
      ),
    ]);

    const allStatuses = await db.trainingComponentUserStatus.findAll();
    expect(allStatuses).toHaveLength(3);
    for (const status of allStatuses)
      expect(status.status).toBe(TrainingStatus.IN_PROGRESS);

    await initReq(global.athlete.token);

    const updatedStatuses = await db.trainingComponentUserStatus.findAll();
    expect(updatedStatuses).toHaveLength(3);
    expect(
      updatedStatuses.filter((s) => s.status === TrainingStatus.COMPLETED),
    ).toHaveLength(2);
    expect(
      updatedStatuses.filter((s) => s.status === TrainingStatus.IN_PROGRESS),
    ).toHaveLength(1);
  });
});
