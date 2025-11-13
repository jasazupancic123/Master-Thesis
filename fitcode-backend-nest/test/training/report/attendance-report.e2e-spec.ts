import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import { generateTrainingComponentUserStatusStub } from '@src/training/mock/training-component-user-status.stub';

describe('Attendance Report', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;
  let trainings: Training[];

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institution = await db.institutions.createTest({
      createRandomAthlete: true,
      athletes: [global.athlete],
    });

    group = await db.groups.createTest(institution);
    trainings = await Promise.all([
      db.trainings.createTest(group),
      db.trainings.createTest(group),
      db.trainings.createTest(group),
    ]);
  });

  afterAll(async () => {
    await db.institutions.remove(institution.id);
    await db.clear();
    await testApp.close();
  });

  afterEach(async () => {
    await db.trainingComponentUserStatus.deleteAllByTraining(trainings[0].id);
    await db.trainingComponentUserStatus.deleteAllByTraining(trainings[1].id);
    await db.trainingComponentUserStatus.deleteAllByTraining(trainings[2].id);
  });

  async function req(token: string, groupId: string) {
    return testApp.http.get(
      `/training/report/attendance?groupId=${groupId}`,
      token,
    );
  }

  it.each([
    ['athlete', global.athlete.token],
    ['admin', global.admin.token],
  ])('should fail if user is %s', async (_, token) => {
    const res = await req(token, group.id);
    expect(res.status).toBe(403);
  });

  it('should return empty count if no statuses', async () => {
    const res = await req(global.trainer.token, group.id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('should not count non-completed statuses', async () => {
    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainings[0].id,
        'c1',
        global.athlete.uid,
        { groupId: group.id, status: TrainingStatus.IN_PROGRESS },
      ),
    );

    const res = await req(global.trainer.token, group.id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('should return correct count if multiple completed statuses', async () => {
    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainings[0].id,
        'c1',
        global.athlete.uid,
        { groupId: group.id, status: TrainingStatus.COMPLETED },
      ),
    );

    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainings[0].id,
        'c2',
        global.athlete.uid,
        { groupId: group.id, status: TrainingStatus.COMPLETED },
      ),
    );

    const res = await req(global.trainer.token, group.id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      [global.athlete.uid]: 1, // still only 1 unique training completed
    });
  });

  it('should count multiple athletes correctly', async () => {
    // athlete 1 has completed 2 trainings, athlete 2 has completed 3 training
    const athlete1Id = institution.athleteIds[0];
    const athlete2Id = institution.athleteIds[1];
    const data = { groupId: group.id, status: TrainingStatus.COMPLETED };

    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainings[0].id,
        'c1',
        athlete1Id,
        data,
      ),
    );

    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainings[1].id,
        'c1',
        athlete1Id,
        data,
      ),
    );

    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainings[0].id,
        'c1',
        athlete2Id,
        data,
      ),
    );

    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainings[1].id,
        'c1',
        athlete2Id,
        data,
      ),
    );

    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainings[2].id,
        'c1',
        athlete2Id,
        data,
      ),
    );

    const res = await req(global.trainer.token, group.id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      [athlete1Id]: 2,
      [athlete2Id]: 3,
    });
  });
});
