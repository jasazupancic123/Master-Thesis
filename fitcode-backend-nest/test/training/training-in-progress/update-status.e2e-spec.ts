import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution, TestUser } from '@src/common/type/entity.type';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import { generateTrainingComponent } from '@src/training/mock/training.stub';

describe('Update Training Component Status (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution1: TestInstitution;
  let institution2: TestInstitution;
  let group1: Group;
  let group2: Group;
  let training1: Training;
  let training2: Training;

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

    const athletes: TestUser[] = await Promise.all([
      testApp.auth.createAthlete(),
      testApp.auth.createAthlete(),
      testApp.auth.createAthlete(),
    ]);

    institution2 = await db.institutions.createTest({
      createRandomManager: true,
      createRandomTrainer: true,
      athletes,
    });

    group2 = await db.groups.createTest(institution2);
    training2 = await db.trainings.createTest(group2, {
      components: [
        generateTrainingComponent({ id: 'c1' }),
        generateTrainingComponent({ id: 'c3' }),
      ],
    });
  });

  afterAll(async () => {
    await db.institutions.remove(institution1.id);
    await db.institutions.remove(institution2.id);
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

  async function req(
    token: string,
    trainingId: string,
    componentId: string,
    status: TrainingStatus,
    userId?: string,
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/component/${componentId}/status`,
      token,
      { status, userId },
    );
  }

  it('should throw error if status is not COMPLETED or CANCELLED', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(
      athlete.token,
      training1.id,
      'c1',
      TrainingStatus.IN_PROGRESS,
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'You can only complete or cancel training component',
    );
  });

  it('should throw error if training not found', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(
      athlete.token,
      'non-existing-training-id',
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training not found');
  });

  it('should throw error if component not found', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(
      athlete.token,
      training1.id,
      'non-existing-component-id',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Component not found');
  });

  it('should throw error if trainer tries to update status for undefined athlete id', async () => {
    const trainer = institution2.trainers[0];
    const res = await req(
      trainer.token,
      training2.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You must provide athlete');
  });

  it('should throw error if training report does not exist yet (it was not started yet)', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(
      athlete.token,
      training1.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Training report not found');
  });

  it('should update training component status to COMPLETED', async () => {
    const athlete = institution1.athletes[0];

    // start training component first
    let res = await startReq(athlete.token, training1.id, 'c1');
    expect(res.status).toBe(201);

    // then complete it
    res = await req(
      athlete.token,
      training1.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(201);

    // verify in db
    const report = await db.trainingReports.findById({
      trainingId: training1.id,
      userId: athlete.uid,
    });

    let c1Status = report.componentStatuses.find(
      (c) => c.componentId === 'c1',
    ).status;
    expect(c1Status).toBe(TrainingStatus.COMPLETED);

    let c2Status = report.componentStatuses.find(
      (c) => c.componentId === 'c2',
    ).status;
    expect(c2Status).toBe(TrainingStatus.NOT_STARTED);

    expect(report.status).toBe(TrainingStatus.IN_PROGRESS);

    res = await req(
      athlete.token,
      training1.id,
      'c2',
      TrainingStatus.COMPLETED,
    );
    expect(res.status).toBe(201);

    // verify in db
    const updatedReport = await db.trainingReports.findById({
      trainingId: training1.id,
      userId: athlete.uid,
    });

    c1Status = updatedReport.componentStatuses.find(
      (c) => c.componentId === 'c1',
    ).status;
    expect(c1Status).toBe(TrainingStatus.COMPLETED);

    c2Status = updatedReport.componentStatuses.find(
      (c) => c.componentId === 'c2',
    ).status;
    expect(c2Status).toBe(TrainingStatus.COMPLETED);

    expect(updatedReport.status).toBe(TrainingStatus.COMPLETED);

    // delete report
    await db.trainingReports.deleteAllByTraining(training1.id);
  });

  it('should update training component status to CANCELLED', async () => {
    const athlete = institution1.athletes[0];

    // start training component first
    let res = await startReq(athlete.token, training1.id, 'c1');
    expect(res.status).toBe(201);

    // then cancel it
    res = await req(
      athlete.token,
      training1.id,
      'c1',
      TrainingStatus.CANCELLED,
    );
    expect(res.status).toBe(201);

    // verify in db
    const report = await db.trainingReports.findById({
      trainingId: training1.id,
      userId: athlete.uid,
    });

    let c1Status = report.componentStatuses.find(
      (c) => c.componentId === 'c1',
    ).status;
    expect(c1Status).toBe(TrainingStatus.CANCELLED);

    let c2Status = report.componentStatuses.find(
      (c) => c.componentId === 'c2',
    ).status;
    expect(c2Status).toBe(TrainingStatus.NOT_STARTED);

    expect(report.status).toBe(TrainingStatus.IN_PROGRESS);

    res = await req(
      athlete.token,
      training1.id,
      'c2',
      TrainingStatus.CANCELLED,
    );
    expect(res.status).toBe(201);

    // verify in db
    const updatedReport = await db.trainingReports.findById({
      trainingId: training1.id,
      userId: athlete.uid,
    });

    c1Status = updatedReport.componentStatuses.find(
      (c) => c.componentId === 'c1',
    ).status;
    expect(c1Status).toBe(TrainingStatus.CANCELLED);

    c2Status = updatedReport.componentStatuses.find(
      (c) => c.componentId === 'c2',
    ).status;
    expect(c2Status).toBe(TrainingStatus.CANCELLED);

    expect(updatedReport.status).toBe(TrainingStatus.COMPLETED);

    // delete report
    await db.trainingReports.deleteAllByTraining(training1.id);
  });
});
