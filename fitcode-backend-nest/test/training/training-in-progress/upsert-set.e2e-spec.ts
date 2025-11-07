import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type {
  CreateWorkload,
  Workload,
} from '@src/training/entity/workload.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({ field: 'c1' });
  const c2 = generateComponentStub({ field: 'c2' });

  return { Components: [c1, c2] };
});

describe('Upsert Set (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;
  let trainingId: string;

  beforeAll(async () => {
    testApp = await TestApp.init();
    const exerciseService = testApp.module.get(ExerciseService);

    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest({
      createRandomAthlete: true,
      athletes: [global.athlete],
    });

    group = await db.groups.createTest(institution);

    await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ name: 'squat', components: ['c1'] }),
      generateExerciseStub({ name: 'bench', components: ['c1'] }),
      generateExerciseStub({ name: 'deadlift', components: ['c1'] }),
    ]);

    trainingId = await db.trainings.save(
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        ownerId: global.trainer.uid,
        membersIds: institution.athletes.map((a) => a.uid),
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [generateExerciseSet(1)],
                  }),
                ],
              }),
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift',
                    sets: [
                      generateExerciseSet(1),
                      generateExerciseSet(2),
                      generateExerciseSet(3),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [generateExerciseSet(1), generateExerciseSet(2)],
                  }),
                ],
              }),
            ],
          }),
          generateTrainingComponent({
            id: 'c2',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1),
                      generateExerciseSet(2),
                      generateExerciseSet(3),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  });

  afterAll(async () => {
    await Promise.all([
      db.trainings.clear(),
      db.groups.delete(group.id),
      db.institutions.remove(institution.id),
      db.trainings.delete(trainingId),
      db.exercises.clear(),
    ]);

    await testApp.close();
  });

  async function req(
    token: string,
    trainingId: string,
    componentId: string,
    exerciseId: string,
    supersetIndex: number,
    setNumber: number,
    body: CreateWorkload,
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/component/${componentId}/exercise/${exerciseId}/superset/${supersetIndex}/set/${setNumber}`,
      token,
      body,
    );
  }

  async function startTrainingComponentReq(
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

  it('should fail if component has not been started yet', async () => {
    const res = await req(
      global.trainer.token,
      trainingId,
      'c2',
      'squat',
      0,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        recTime: 0,
        reps: 1,
      },
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      'Training component has not been started yet',
    );
  });

  it('should fail if report has been completed', async () => {
    // start component
    await startTrainingComponentReq(global.trainer.token, trainingId, 'c1');

    // mark as completed
    await db.trainingReports.updateStatus(
      { trainingId, userId: global.athlete.uid },
      'c1',
      TrainingStatus.COMPLETED,
    );

    const res = await req(
      global.trainer.token,
      trainingId,
      'c1',
      'squat',
      0,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        recTime: 0,
        reps: 1,
      },
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      'Training component has already been completed',
    );
  });

  it('should fail if component does not exist', async () => {
    await startTrainingComponentReq(global.trainer.token, trainingId, 'c1');

    const res = await req(
      global.trainer.token,
      trainingId,
      'non-existing',
      'squat',
      0,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 1,
        recTime: 0,
      },
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Component not found in training');

    await db.trainingReports.deleteAllByTraining(trainingId);
  });

  it('should fail if superset does not exist', async () => {
    // start component
    await startTrainingComponentReq(global.trainer.token, trainingId, 'c1');

    const res = await req(
      global.trainer.token,
      trainingId,
      'c1',
      'squat',
      10,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 1,
        recTime: 0,
      },
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Superset not found');

    await db.trainingReports.deleteAllByTraining(trainingId);
  });

  it('should fail if exercise not found in training', async () => {
    // start component
    await startTrainingComponentReq(global.trainer.token, trainingId, 'c1');

    const res = await req(
      global.trainer.token,
      trainingId,
      'c1',
      'bench',
      0,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 1,
        recTime: 0,
      },
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Exercise not found in superset');

    await db.trainingReports.deleteAllByTraining(trainingId);
  });

  it('should fail if set number not found in exercise', async () => {
    // start component
    await startTrainingComponentReq(global.trainer.token, trainingId, 'c1');

    const res = await req(
      global.trainer.token,
      trainingId,
      'c1',
      'squat',
      0,
      10,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        recTime: 0,
        reps: 1,
      },
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Set number not found in exercise');

    await db.trainingReports.deleteAllByTraining(trainingId);
  });

  it('should successfully create a set', async () => {
    // start component
    await startTrainingComponentReq(global.trainer.token, trainingId, 'c1');

    const res = await req(
      global.trainer.token,
      trainingId,
      'c1',
      'squat',
      0,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 6,
        recTime: 0,
      },
    );

    expect(res.status).toBe(201);
    const result = res.body as Workload;

    expect(result.trainingId).toBe(trainingId);
    expect(result.componentId).toBe('c1');
    expect(result.exerciseId).toBe('squat');
    expect(result.supersetIndex).toBe(0);
    expect(result.setNumber).toBe(1);
    expect(result.reps).toBe(6);

    await db.workloads.deleteAll(trainingId);
    await db.trainingReports.deleteAllByTraining(trainingId);
  });

  it('should successfully update a set', async () => {
    // start component
    await startTrainingComponentReq(global.trainer.token, trainingId, 'c1');

    await db.workloads.createMany([
      {
        trainingId,
        componentId: 'c1',
        exerciseId: 'squat',
        supersetIndex: 0,
        setNumber: 1,
        userId: global.athlete.uid,
        status: SetStatus.COMPLETED,
        reps: 6,
        recTime: 60,
        prescribed: { reps: 1, recTime: 60 },
      },
    ]);

    const workloadsBefore = await db.workloads.getAll(trainingId);
    expect(workloadsBefore).toHaveLength(1);

    const res = await req(
      global.trainer.token,
      trainingId,
      'c1',
      'squat',
      0,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 6,
        recTime: 0,
      },
    );

    expect(res.status).toBe(201);
    const result = res.body as Workload;
    expect(result.id).toContain(workloadsBefore[0].id);

    const workloadsAfter = await db.workloads.getAll(trainingId);
    expect(workloadsAfter).toHaveLength(1);

    await db.workloads.deleteAll(trainingId);
    await db.trainingReports.deleteAllByTraining(trainingId);
  });

  it('should be able to insert all possible properties', async () => {
    // start component
    await startTrainingComponentReq(global.trainer.token, trainingId, 'c1');

    const res = await req(
      global.trainer.token,
      trainingId,
      'c1',
      'squat',
      0,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 6,
        repsR: 5,
        loadKg: 60,
        loadKgR: 50,
        tempoEcc: 2.1,
        tempoIso: 5.1,
        tempoCon: 3.2,
        tempoIdle: 0.1,
        tempoEccR: 3.1,
        tempoIsoR: 0.1,
        tempoConR: 2.2,
        tempoIdleR: 4.1,
        vel: 0.5,
        velR: 0.4,
        rom: 50,
        romR: 45,
        rir: 2,
        rirR: 3,
        notes: 'some notes',
        dist: 50,
        distR: 52,
        eff: 1,
        effR: 2,
        photoURLs: ['url1', 'url2', 'url3'],
        recDist: 500,
        recDistR: 505,
        recTime: 60,
        recTimeR: 52,
        time: 300,
        timeR: 298,
      },
    );

    expect(res.status).toBe(201);
    const result = res.body as Workload;

    expect(result.trainingId).toBe(trainingId);
    expect(result.componentId).toBe('c1');
    expect(result.exerciseId).toBe('squat');
    expect(result.supersetIndex).toBe(0);
    expect(result.setNumber).toBe(1);

    expect(result.reps).toBe(6);
    expect(result.repsR).toBe(5);
    expect(result.loadKg).toBe(60);
    expect(result.loadKgR).toBe(50);
    expect(result.tempoEcc).toBe(2.1);
    expect(result.tempoIso).toBe(5.1);
    expect(result.tempoCon).toBe(3.2);
    expect(result.tempoIdle).toBe(0.1);
    expect(result.tempoEccR).toBe(3.1);
    expect(result.tempoIsoR).toBe(0.1);
    expect(result.tempoConR).toBe(2.2);
    expect(result.tempoIdleR).toBe(4.1);
    expect(result.vel).toBe(0.5);
    expect(result.velR).toBe(0.4);
    expect(result.rom).toBe(50);
    expect(result.romR).toBe(45);
    expect(result.rir).toBe(2);
    expect(result.rirR).toBe(3);
    expect(result.notes).toBe('some notes');
    expect(result.dist).toBe(50);
    expect(result.distR).toBe(52);
    expect(result.eff).toBe(1);
    expect(result.effR).toBe(2);
    expect(result.photoURLs).toEqual(['url1', 'url2', 'url3']);
    expect(result.recTime).toBe(60);
    expect(result.recTimeR).toBe(52);
    expect(result.recDist).toBe(500);
    expect(result.recDistR).toBe(505);
    expect(result.time).toBe(300);
    expect(result.timeR).toBe(298);

    await db.workloads.deleteAll(trainingId);
    await db.trainingReports.deleteAllByTraining(trainingId);
  });
});
