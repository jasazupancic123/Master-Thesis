import { TestApp } from '@test/common/utils/app.util';

import { UserRole } from '@src/auth/enum/user-role.enum';
import type { TestInstitution, TestUser } from '@src/common/type/entity.type';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import { generateTrainingComponent } from '@src/training/mock/training.stub';

describe('Finalize Training Component (e2e)', () => {
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
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/component/${componentId}/finalize`,
      token,
      { status },
    );
  }

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

  it('should throw error if manager cannot access this training', async () => {
    const res = await req(
      institution2.manager.token,
      training1.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this training');
  });

  it('should throw error if trainer cannot access this training', async () => {
    const res = await req(
      institution2.trainers[0].token,
      training1.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this training');
  });

  it('should throw error if athlete cannot access this training', async () => {
    const newAthlete = await testApp.auth.createAthlete();
    await db.institutions.institutionMembersRepository.addMember(
      { role: UserRole.ATHLETE },
      { institutionId: institution1.id, uid: newAthlete.uid },
    );

    const res = await req(
      newAthlete.token,
      training1.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this training');

    await db.institutions.institutionMembersRepository.removeMember({
      institutionId: institution1.id,
      uid: newAthlete.uid,
    });

    await testApp.auth.deleteUser(newAthlete.uid);
  });

  it('should throw error if component not found in training', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(
      athlete.token,
      training1.id,
      'non-existing-component',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Component not found');
  });

  it('should successfully finalize training component for athlete', async () => {
    const athlete = institution1.athletes[0];

    // start component first
    await startReq(athlete.token, training1.id, 'c1');

    // complete it
    const res = await req(
      athlete.token,
      training1.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(201);
    const reports = await db.trainingReports.getAllByTraining(training1.id);
    expect(reports).toHaveLength(1);

    const c1Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c1',
    );
    const c2Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c2',
    );

    expect(c1Status.status).toBe(TrainingStatus.COMPLETED);
    expect(c2Status.status).toBe(TrainingStatus.NOT_STARTED);
    await db.trainingReports.deleteAllByTraining(training1.id);
  });

  it('should successfully finalize training component for trainer and all athletes in training', async () => {
    const trainer = institution2.trainers[0];

    // start component first
    await startReq(trainer.token, training2.id, 'c1');

    // complete it
    const res = await req(
      trainer.token,
      training2.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(201);
    const reports = await db.trainingReports.getAllByTraining(training2.id);
    expect(reports).toHaveLength(3);

    for (const athlete of institution2.athletes) {
      const report = reports.find((r) => r.userId === athlete.uid);
      expect(report).toBeDefined();

      const c1Status = report.componentStatuses.find(
        (c) => c.componentId === 'c1',
      );
      expect(c1Status.status).toBe(TrainingStatus.COMPLETED);

      const c3Status = report.componentStatuses.find(
        (c) => c.componentId === 'c3',
      );
      expect(c3Status.status).toBe(TrainingStatus.NOT_STARTED);
    }

    await db.trainingReports.deleteAllByTraining(training2.id);
  });

  it('should throw error if component is not started yet', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(
      athlete.token,
      training1.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training component not started yet');
  });

  it('should throw error if component is already completed', async () => {
    const athlete = institution1.athletes[0];

    // start component first
    await startReq(athlete.token, training1.id, 'c1');
    // complete it
    await req(athlete.token, training1.id, 'c1', TrainingStatus.COMPLETED);
    // try to complete again
    const res = await req(
      athlete.token,
      training1.id,
      'c1',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training component already completed');
  });

  it('should complete all components and training itself', async () => {
    const athlete = institution1.athletes[0];

    // start and complete c1
    await startReq(athlete.token, training1.id, 'c1');
    await req(athlete.token, training1.id, 'c1', TrainingStatus.COMPLETED);

    // start and complete c2
    await startReq(athlete.token, training1.id, 'c2');
    const res = await req(
      athlete.token,
      training1.id,
      'c2',
      TrainingStatus.COMPLETED,
    );

    expect(res.status).toBe(201);
    const reports = await db.trainingReports.getAllByTraining(training1.id);
    expect(reports).toHaveLength(1);
    expect(reports[0].completed).toBe(true);

    const c1Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c1',
    );
    const c2Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c2',
    );

    expect(c1Status.status).toBe(TrainingStatus.COMPLETED);
    expect(c2Status.status).toBe(TrainingStatus.COMPLETED);
    await db.trainingReports.deleteAllByTraining(training1.id);
  });
});
