import { TestApp } from '@test/common/utils/app.util';

import { UserRole } from '@src/auth/enum/user-role.enum';
import type { TestInstitution, TestUser } from '@src/common/type/entity.type';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';
import { TrainingReportRepository } from '@src/training/repository/training-report.repository';

describe('Start Training Component (e2e)', () => {
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
        generateTrainingComponent({
          id: 'c1',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({
                  id: 'e1',
                  sets: [generateExerciseSet(1)],
                }),
              ],
            }),
          ],
        }),
        generateTrainingComponent({ id: 'c3' }),
      ],
    });
  });

  afterAll(async () => {
    await db.institutions.remove(institution1.id);
    await db.institutions.remove(institution2.id);
    await db.clear();
  });

  async function req(token: string, trainingId: string, componentId: string) {
    return await testApp.http.post(
      `/training/${trainingId}/component/${componentId}/start`,
      token,
      {},
    );
  }

  it('should throw error if training not found', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(athlete.token, 'non-existing-training-id', 'c1');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training not found');
  });

  it('should throw error if manager cannot access this training', async () => {
    const res = await req(institution2.manager.token, training1.id, 'c1');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this training');
  });

  it('should throw error if trainer cannot access this training', async () => {
    const res = await req(institution2.trainers[0].token, training1.id, 'c1');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this training');
  });

  it('should throw error if athlete cannot access this training', async () => {
    const newAthlete = await testApp.auth.createAthlete();
    await db.institutions.institutionMembersRepository.addMember(
      { role: UserRole.ATHLETE },
      { institutionId: institution1.id, uid: newAthlete.uid },
    );

    const res = await req(newAthlete.token, training1.id, 'c1');
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
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Component not found');
  });

  it('should successfully start training component for athlete', async () => {
    const athlete = institution1.athletes[0];
    const res = await req(athlete.token, training1.id, 'c1');
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      [athlete.uid]: expect.objectContaining({ id: training1.id }),
    });

    const reports = await db.trainingReports.getAllByTraining(training1.id);
    expect(reports).toHaveLength(1);

    const c1Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c1',
    );

    expect(c1Status.status).toBe(TrainingStatus.IN_PROGRESS);

    const c2Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c2',
    );

    expect(c2Status.status).toBe(TrainingStatus.NOT_STARTED);

    await db.trainingReports.deleteAllByTraining(training1.id);
  });

  it('should successfully start training component for trainer and all athletes in training', async () => {
    const trainer = institution2.trainers[0];
    const res = await req(trainer.token, training2.id, 'c1');
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      [institution2.athletes[0].uid]: expect.objectContaining({
        id: training2.id,
      }),
      [institution2.athletes[1].uid]: expect.objectContaining({
        id: training2.id,
      }),
      [institution2.athletes[2].uid]: expect.objectContaining({
        id: training2.id,
      }),
    });

    const reports = await db.trainingReports.getAllByTraining(training2.id);
    expect(reports).toHaveLength(3);

    for (const athlete of institution2.athletes) {
      const report = reports.find((r) => r.userId === athlete.uid);
      expect(report).toBeDefined();

      const c1Status = report.componentStatuses.find(
        (c) => c.componentId === 'c1',
      );
      expect(c1Status.status).toBe(TrainingStatus.IN_PROGRESS);

      const c3Status = report.componentStatuses.find(
        (c) => c.componentId === 'c3',
      );
      expect(c3Status.status).toBe(TrainingStatus.NOT_STARTED);
    }

    await db.trainingReports.deleteAllByTraining(training2.id);
  });

  it('should not create duplicate training report if started twice', async () => {
    const trainingReportRepository = testApp.module.get(
      TrainingReportRepository,
    );

    let trainingReportRepositorySpy = jest.spyOn(
      trainingReportRepository,
      'update',
    );

    const athlete = institution1.athletes[0];

    let res = await req(athlete.token, training1.id, 'c1');
    expect(res.status).toBe(201);
    res = await req(athlete.token, training1.id, 'c1');
    expect(res.status).toBe(201);

    expect(trainingReportRepositorySpy).toHaveBeenCalledTimes(0); // first time only 'save' is called
    trainingReportRepositorySpy.mockRestore();

    const reports = await db.trainingReports.getAllByTraining(training1.id);
    expect(reports).toHaveLength(1);
    await db.trainingReports.deleteAllByTraining(training1.id);
  });

  it('should throw error if component is already completed', async () => {
    const athlete = institution1.athletes[0];
    await req(athlete.token, training1.id, 'c1');
    await db.trainingReports.updateStatus(
      { trainingId: training1.id, userId: athlete.uid },
      'c1',
      TrainingStatus.COMPLETED,
    );

    const res = await req(athlete.token, training1.id, 'c1');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training component already completed');
    await db.trainingReports.deleteAllByTraining(training1.id);
  });

  it('should not throw error if new component in same training is started', async () => {
    const athlete = institution1.athletes[0];
    await req(athlete.token, training1.id, 'c1');
    const res = await req(athlete.token, training1.id, 'c2');
    expect(res.status).toBe(201);

    const reports = await db.trainingReports.getAllByTraining(training1.id);
    expect(reports).toHaveLength(1);

    const c1Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c1',
    );
    const c2Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c2',
    );

    expect(c1Status.status).toBe(TrainingStatus.IN_PROGRESS);
    expect(c2Status.status).toBe(TrainingStatus.IN_PROGRESS);
    await db.trainingReports.deleteAllByTraining(training1.id);
  });

  it('should successfully go into training in progress if training component was cancelled', async () => {
    const athlete = institution1.athletes[0];
    await req(athlete.token, training1.id, 'c1');

    await db.trainingReports.updateStatus(
      { trainingId: training1.id, userId: athlete.uid },
      'c1',
      TrainingStatus.CANCELLED,
    );

    const res = await req(athlete.token, training1.id, 'c1');
    expect(res.status).toBe(201);

    const reports = await db.trainingReports.getAllByTraining(training1.id);
    expect(reports).toHaveLength(1);

    const c1Status = reports[0].componentStatuses.find(
      (c) => c.componentId === 'c1',
    );

    expect(c1Status.status).toBe(TrainingStatus.IN_PROGRESS);
    await db.trainingReports.deleteAllByTraining(training1.id);
  });

  it('should not override athlete trainings in progress when trainer starts the same training component', async () => {
    // in institution2, lets say that first athlete has already started c1 and has some workloads and reports already
    const athlete = institution2.athletes[0];
    await req(athlete.token, training2.id, 'c1');

    let reports = await db.trainingReports.getAllByTraining(training2.id);
    expect(reports).toHaveLength(1); // athlete started c1

    // create some workloads
    await db.workloads.createMany([
      {
        trainingId: training2.id,
        userId: athlete.uid,
        componentId: 'c1',
        exerciseId: 'e1',
        setNumber: 1,
        status: SetStatus.PARTIAL,
        supersetIndex: 0,
        prescribed: { reps: 10, loadKg: 50 },
        reps: 13,
        loadKg: 37.5,
      },
    ]);

    const trainer = institution2.trainers[0];
    const res = await req(trainer.token, training2.id, 'c1');
    expect(res.status).toBe(201);

    reports = await db.trainingReports.getAllByTraining(training2.id);
    expect(reports).toHaveLength(3);

    const trainings = res.body as Record<string, Training>;
    expect(trainings[athlete.uid].id).toBe(training2.id);

    const firstSet =
      trainings[athlete.uid].components[0].supersets[0].exercises[0].sets[0];

    expect(firstSet.reps).toBe(13);
    expect(firstSet.loadKg).toBe(37.5);

    // also check in db that workload is still the same
    const workloads = await db.workloads.getAll(training2.id);
    expect(workloads).toHaveLength(1);
    expect(workloads[0].setNumber).toBe(1);
    expect(workloads[0].status).toBe(SetStatus.PARTIAL);

    // clean up
    await db.workloads.deleteAll(training2.id);
    await db.trainingReports.deleteAllByTraining(training2.id);
  });

  it('should make multiple components in progress if athlete starts different component and then trainer starts another component', async () => {
    const athlete = institution2.athletes[1];
    let res = await req(athlete.token, training2.id, 'c1');
    expect(res.status).toBe(201);

    let reports = await db.trainingReports.getAllByTraining(training2.id);
    expect(reports).toHaveLength(1);

    let athleteReport = reports.find((r) => r.userId === athlete.uid);
    let c1Status = athleteReport.componentStatuses.find(
      (c) => c.componentId === 'c1',
    );
    let c3Status = athleteReport.componentStatuses.find(
      (c) => c.componentId === 'c3',
    );

    expect(c1Status.status).toBe(TrainingStatus.IN_PROGRESS);
    expect(c3Status.status).toBe(TrainingStatus.NOT_STARTED);

    const trainer = institution2.trainers[0];
    res = await req(trainer.token, training2.id, 'c3');
    expect(res.status).toBe(201);

    reports = await db.trainingReports.getAllByTraining(training2.id);
    expect(reports).toHaveLength(3);

    athleteReport = reports.find((r) => r.userId === athlete.uid);
    c1Status = athleteReport.componentStatuses.find(
      (c) => c.componentId === 'c1',
    );
    c3Status = athleteReport.componentStatuses.find(
      (c) => c.componentId === 'c3',
    );

    expect(c1Status.status).toBe(TrainingStatus.IN_PROGRESS);
    expect(c3Status.status).toBe(TrainingStatus.IN_PROGRESS);

    // clean up
    await db.trainingReports.deleteAllByTraining(training2.id);
  });
});
