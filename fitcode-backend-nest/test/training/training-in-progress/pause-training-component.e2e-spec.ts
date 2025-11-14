import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import { generateTrainingComponent } from '@src/training/mock/training.stub';

describe('Pause Training Status (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution1: TestInstitution;
  let group1: Group;
  let training1: Training;

  beforeAll(async () => {
    testApp = await TestApp.init();

    db = testApp.module.get(TestDbService);
    institution1 = await db.institutions.createTest();
    group1 = await db.groups.createTest(institution1);
    training1 = await db.trainings.createTest(group1, {
      components: [
        generateTrainingComponent({ id: 'c1' }),
        generateTrainingComponent({ id: 'c2' }),
      ],
    });
  });

  afterAll(async () => {
    await db.institutions.remove(institution1.id);
    await db.clear();
  });

  async function startReq(
    token: string,
    trainingId: string,
    componentId: string,
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/component/${componentId}/start`,
      token,
      {},
    );
  }

  async function req(token: string, trainingId: string, componentId: string) {
    return await testApp.http.patch(
      `/training/${trainingId}/component/${componentId}/pause`,
      token,
    );
  }

  it('should throw error if training not found', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(athlete.token, 'non-existing-training-id', 'c1');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training not found');
  });

  it('should throw error if component not found', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(
      athlete.token,
      training1.id,
      'non-existing-component-id',
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Component not found');
  });

  it('should throw error if training report does not exist yet (it was not started yet)', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(athlete.token, training1.id, 'c1');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training component not started');
  });

  it('should throw error if component is not in progress', async () => {
    const athlete = institution1.athletes[0];

    // start component first
    await startReq(athlete.token, training1.id, 'c1');
    await req(athlete.token, training1.id, 'c1');

    // try to pause again
    const res = await req(athlete.token, training1.id, 'c1');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'You can only pause training that is currently in progress',
    );
  });

  it('should pause training component successfully', async () => {
    const athlete = institution1.athletes[0];

    // start component first
    await startReq(athlete.token, training1.id, 'c2');

    // pause component
    const res = await req(athlete.token, training1.id, 'c2');
    expect(res.status).toBe(200);

    const report = await db.trainingComponentUserStatus.findById({
      trainingId: training1.id,
      componentId: 'c2',
      uid: athlete.uid,
    });

    expect(report.status).toBe(TrainingStatus.PAUSED);

    // delete report for next tests
    await db.trainingComponentUserStatus.deleteAllByTraining(training1.id);
  });
});
