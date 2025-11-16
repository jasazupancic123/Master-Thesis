import { TestApp } from '@test/common/utils/app.util';
import { expectDatesToMatchUpToMinute } from '@test/common/utils/date.util';
import { addDays } from 'date-fns';

import type { DateRangeDto } from '@src/common/dto/date-range.dto';
import type { TestInstitution } from '@src/common/type/entity.type';
import { getTime } from '@src/common/utils/date.util';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import { generateTrainingComponentUserStatusStub } from '@src/training/mock/training-component-user-status.stub';

describe('Move Training (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  // first institution
  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);
    training = await db.trainings.createTest(group, {
      cycleId: group.cycles[1].id,
    });
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(
    body: DateRangeDto,
    trainingId = training.id,
    token: string = global.trainer.token,
  ) {
    return await testApp.http.patch(
      `/training/${trainingId}/move`,
      token,
      body,
    );
  }

  it('should fail if user is athlete', async () => {
    const res = await req(
      { from: new Date(), to: new Date() },
      training.id,
      global.athlete.token,
    );

    expect(res.status).toBe(403);
  });

  it('should successfully move training', async () => {
    const from = getTime(addDays(training.from, 2), 14, 0);
    const to = getTime(addDays(training.to, 2), 15, 0);

    const res = await req({ from, to }, training.id, global.trainer.token);
    expect(res.status).toBe(200);

    const dbTraining = await db.trainings.findById(training.id);
    expectDatesToMatchUpToMinute(dbTraining.from, from);
    expectDatesToMatchUpToMinute(dbTraining.to, to);
  });

  it('should successfully move active training and delete all current component statuses', async () => {
    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        training.id,
        'c1',
        global.athlete.uid,
      ),
    );

    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        training.id,
        'c2',
        global.athlete.uid,
      ),
    );

    const dbStatusesBefore =
      await db.trainingComponentUserStatus.findAllByUserTraining(
        global.athlete.uid,
        training.id,
      );

    expect(dbStatusesBefore.length).toBe(2);

    const from = getTime(addDays(training.from, 3), 18, 0);
    const to = getTime(addDays(training.to, 3), 20, 0);
    const res = await req({ from, to }, training.id, global.trainer.token);
    expect(res.status).toBe(200);

    const dbStatusesAfter =
      await db.trainingComponentUserStatus.findAllByUserTraining(
        global.athlete.uid,
        training.id,
      );

    expect(dbStatusesAfter.length).toBe(0);

    const dbTraining = await db.trainings.findById(training.id);
    expectDatesToMatchUpToMinute(dbTraining.from, from);
    expectDatesToMatchUpToMinute(dbTraining.to, to);
  });
});
