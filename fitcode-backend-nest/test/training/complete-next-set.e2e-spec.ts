import { TestApp } from '@test/common/utils/app.util';
import { addHours, subDays } from 'date-fns';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { Component } from '@src/component/entity/component.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type {
  CreateWorkload,
  Workload,
} from '@src/training/entity/workload.entity';
import { LoadType } from '@src/training/enum/load-type.enum';
import { SetStatus } from '@src/training/enum/set-status.enum';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';
import { WorkloadService } from '@src/training/service/workload.service';

describe('Complete Next Set (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let workloadService: WorkloadService;

  let institution: TestInstitution;
  let group: Group;
  let component1: Component;
  let trainingId: string;

  beforeAll(async () => {
    testApp = await TestApp.init();
    workloadService = testApp.module.get(WorkloadService);
    const exerciseService = testApp.module.get(ExerciseService);

    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest({
      createRandomAthlete: true,
      athletes: [global.athlete],
    });

    group = await db.groups.createTest(institution);

    [component1] = await Promise.all([
      db.components.create({ id: 'c1' }),
      db.components.create({ id: 'c2' }),
    ]);

    await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ name: 'squat', componentIds: ['c1'] }),
      generateExerciseStub({ name: 'bench', componentIds: ['c1'] }),
      generateExerciseStub({ name: 'deadlift', componentIds: ['c1'] }),
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
                    sets: [generateExerciseSet(1, { reps: 10, loadKg: 50 })],
                  }),
                  generateTrainingExercise({
                    id: 'bench',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                    ],
                  }),
                ],
              }),
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(3, { reps: 10, loadKg: 50 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                    ],
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
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(3, { reps: 10, loadKg: 50 }),
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
      db.components.clear(),
    ]);

    await testApp.close();
  });

  async function req(
    token: string,
    trainingId: string,
    exerciseId: string,
    body: CreateWorkload,
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/exercise/${exerciseId}/complete-next-set`,
      token,
      body,
    );
  }

  it('should throw error if training not found', async () => {
    const res = await req(
      global.trainer.token,
      'invalid-training-id',
      'invalid-exercise-id',
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 1,
        recTime: 0,
        photoURLs: [],
      },
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training not found');
  });

  it.each([
    ['trainer', global.trainer.token],
    ['manager', global.manager.token],
    ['athlete', global.athlete.token],
  ])(
    'should fetch athlete from request by %s for completing next set',
    async (_, token) => {
      const trainingService = testApp.module.get(TrainingService);
      const spy = jest.spyOn(trainingService as any, 'getAthlete');

      await req(token, trainingId, 'invalid-exercise-id', {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 1,
        recTime: 0,
        photoURLs: [],
      });

      const spyResult = spy.mock.results[0].value;
      await expect(spyResult).resolves.toHaveProperty(
        'uid',
        global.athlete.uid,
      );

      spy.mockRestore();
    },
  );

  it('should fail if exercise does not exist', async () => {
    const res = await req(
      global.trainer.token,
      trainingId,
      'invalid-exercise-id',
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        reps: 1,
        recTime: 0,
        photoURLs: [],
      },
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Exercise does not exist');
  });

  it('should fail if athlete cannot view exercise', async () => {
    const exercise = await db.exercises.create(
      generateExerciseStub({
        ownerId: 'some-other-user-id',
      }),
    );

    const res = await req(global.trainer.token, trainingId, exercise.id, {
      userId: global.athlete.uid,
      timestamp: new Date(),
      reps: 1,
      recTime: 0,
      photoURLs: [],
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You are not allowed to view this exercise');

    await db.exercises.delete(exercise.id);
  });

  it('should fail if training is not today', async () => {
    const pastTrainingId = await db.trainings.save(
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        date: subDays(new Date(), 2),
      }),
    );

    const res = await req(global.trainer.token, pastTrainingId, 'squat', {
      userId: global.athlete.uid,
      timestamp: new Date(),
      reps: 1,
      recTime: 0,
      photoURLs: [],
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Training is not scheduled for today');
  });

  it('should complete first set of exercise (when no workloads are in the database)', async () => {
    const from = new Date();
    const spy = jest.spyOn(workloadService, 'findAllByUserTraining');
    const res = await req(global.trainer.token, trainingId, 'squat', {
      userId: global.athlete.uid,
      timestamp: from,
      notes: 'left hip too low',
      reps: 12,
      loadKg: 100,
      recTime: 60,
      tempo: '2:0:2:0',
    });

    // workloads should not exist yet
    const spyResult = spy.mock.results[0].value;
    await expect(spyResult).resolves.toHaveLength(0);
    spy.mockRestore();

    expect(res.status).toBe(201);

    // workload meta
    const result = res.body as Workload;
    expect(result.institutionId).toBe(institution.id);
    expect(result.groupId).toBe(group.id);
    expect(result.cycleId).toBe(group.cycles[0].id);
    expect(result.trainingId).toBe(trainingId);
    expect(result.exerciseId).toBe('squat');
    expect(result.userId).toBe(global.athlete.uid);
    expect(result.componentId).toBe('c1');
    expect(result.supersetIndex).toBe(0);
    expect(result.setNumber).toBe(1);
    expect(new Date(result.timestamp).getTime()).toBe(from.getTime());
    expect(result.status).toBe(SetStatus.OVER);
    expect(result.notes).toBe('left hip too low');

    // prescribed workload
    expect(result.prescribed.reps).toBe(10);
    expect(result.prescribed.repsR).toBeUndefined();
    expect(result.prescribed.recTime).toBe(60);
    expect(result.prescribed.loadKg).toBe(50);
    expect(result.prescribed.loadKgR).toBeUndefined();

    // completed workload
    expect(result.reps).toBe(12);
    expect(result.repsR).toBeUndefined();
    expect(result.loadKg).toBe(100);
    // additional properties - tempo and rom
    expect(result.tempo).toBe('2:0:2:0');
    expect(result.tempoR).toBeUndefined();
    expect(result.recTime).toBe(60);

    const workloads = await db.workloads.getAll(trainingId);
    expect(workloads).toHaveLength(1);
    expect(workloads[0].id).toBe(result.id);

    // it should create report as well
    const report = await db.trainingReports.findById({
      trainingId,
      userId: global.athlete.uid,
    });

    expect(report).toBeDefined();

    await db.workloads.deleteAll(trainingId);
  });

  it('should complete the next set of same exercise when some workloads already exist', async () => {
    await db.workloads.createMany([
      {
        trainingId,
        component: component1,
        exerciseId: 'squat',
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 1,
        status: SetStatus.PARTIAL,
        reps: 1,
        recTime: 0,
        prescribed: { reps: 10, recTime: 90 },
      },
    ]);

    const from = new Date();
    const spy = jest.spyOn(workloadService, 'findAllByUserTraining');
    const res = await req(global.trainer.token, trainingId, 'squat', {
      userId: global.athlete.uid,
      timestamp: from,
      reps: 10,
      loadKg: 80,
      recTime: 90,
      tempo: '2:0:2:0',
    });

    // workloads should exist now
    const spyResult = spy.mock.results[0].value;
    await expect(spyResult).resolves.toHaveLength(1);
    spy.mockRestore();

    expect(res.status).toBe(201);

    // workload meta
    const result = res.body as Workload;
    expect(result.institutionId).toBe(institution.id);
    expect(result.groupId).toBe(group.id);
    expect(result.cycleId).toBe(group.cycles[0].id);
    expect(result.trainingId).toBe(trainingId);
    expect(result.exerciseId).toBe('squat');
    expect(result.userId).toBe(global.athlete.uid);
    expect(result.componentId).toBe('c1');
    expect(result.supersetIndex).toBe(1); // because first superset squat has only 1 set and is already completed
    expect(result.setNumber).toBe(1);
    expect(new Date(result.timestamp).getTime()).toBe(from.getTime());
    expect(result.status).toBe(SetStatus.OVER);
    expect(result.notes).toBeUndefined();

    // prescribed workload
    expect(result.reps).toBe(10);
    expect(result.repsR).toBeUndefined();
    expect(result.loadKg).toBe(80);
    expect(result.loadKgR).toBeUndefined();
    // additional properties - tempo and rom
    expect(result.tempo).toBe('2:0:2:0');
    expect(result.tempoR).toBeUndefined();
    expect(result.recTime).toBe(90);

    const workloads = await db.workloads.getAll(trainingId);
    expect(workloads).toHaveLength(2);

    await db.workloads.deleteAll(trainingId);
  });

  it('should put over sets into other component', async () => {
    // create min 6 workloads (this will complete all squat exercises in component1)
    await db.workloads.createMany(
      Array.from({ length: 8 }).map((_, i) => ({
        trainingId,
        component: component1,
        exerciseId: 'squat',
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: i,
        status: SetStatus.PARTIAL,
        reps: 1,
        recTime: 0,
        prescribed: { reps: 10, recTime: 90 },
      })),
    );

    const res = await req(global.trainer.token, trainingId, 'squat', {
      userId: global.athlete.uid,
      timestamp: new Date(),
      reps: 8,
      loadKg: 60,
      recTime: 120,
      tempo: '2:0:2:0',
    });

    expect(res.status).toBe(201);

    // workload meta
    const result = res.body as Workload;
    expect(result.componentId).toBe('other');
    expect(result.supersetIndex).toBe(0);
    expect(result.setNumber).toBe(8 - 6 + 1); // 8 existing workloads, 6 of them cover our prescribed training, so we start counting from 3

    const workloads = await db.workloads.getAll(trainingId);
    expect(workloads).toHaveLength(9);
    await db.workloads.deleteAll(trainingId);
  });

  it('should save correct prescribed workload values (if user is in subgroup or has RM, BW prescription)', async () => {
    const trainingId2 = await db.trainings.save(
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
            subgroups: [
              generateSubgroup({
                membersIds: [global.athlete.uid],
                supersets: [
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({
                        id: 'squat',
                        sets: [
                          generateExerciseSet(1, {
                            reps: 5,
                            loadRm: 80,
                            loadType: LoadType.Rm,
                          }),
                          generateExerciseSet(2, {
                            reps: 5,
                            loadBw: 85,
                            loadType: LoadType.Bw,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const bwDate = subDays(new Date(), 3);
    await db.wellness.save(
      { userId: global.athlete.uid, date: bwDate, weight: 78.5 },
      { uid: global.athlete.uid, date: bwDate },
    );

    await db.workloads.createMany([
      {
        trainingId,
        component: component1,
        exerciseId: 'squat',
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 0,
        status: SetStatus.PARTIAL,
        loadKg: 120,
        reps: 1,
        recTime: 0,
        prescribed: { reps: 5, loadRm: 80 }, // 80% of 120 kg
      },
    ]);

    const res1 = await req(global.trainer.token, trainingId2, 'squat', {
      userId: global.athlete.uid,
      timestamp: new Date(),
      reps: 6,
      loadKg: 90,
      recTime: 0,
    });

    expect(res1.status).toBe(201);
    const result1 = res1.body as Workload;

    // reps
    expect(result1.prescribed.reps).toBe(5);
    expect(result1.reps).toBe(6);
    expect(result1.repsR).toBeUndefined();

    // rm
    expect(result1.prescribed.loadKg).toBeLessThan(100); // 80% of 120 kg
    expect(result1.loadKg).toBe(90);
    expect(result1.loadKgR).toBeUndefined();

    const res2 = await req(global.trainer.token, trainingId2, 'squat', {
      userId: global.athlete.uid,
      timestamp: new Date(),
      reps: 4,
      loadKg: 70,
      recTime: 0,
    });

    expect(res2.status).toBe(201);
    const result2 = res2.body as Workload;

    // reps
    expect(result2.prescribed.reps).toBe(5);
    expect(result2.reps).toBe(4);
    expect(result2.repsR).toBeUndefined();

    // bw
    expect(result2.prescribed.loadKg).toBeCloseTo(66.5); // 85% of 78.5 kg, rounded to first 0.25 kg
    expect(result2.loadKg).toBe(70);
    expect(result2.loadKgR).toBeUndefined();

    const workloads = await db.workloads.getAll(trainingId2);
    expect(workloads).toHaveLength(2);
    await db.workloads.deleteAll(trainingId2);
    await db.trainings.delete(trainingId2);
  });

  it('should fail if exercise is unilateral and both sides are not specified', async () => {
    const exercise = await db.exercises.create(
      generateExerciseStub({
        name: 'unilateral-exercise',
        componentIds: ['c1'],
        isUnilateral: true,
      }),
    );

    const trainingId3 = await db.trainings.save(
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
                    id: exercise.id,
                    sets: [generateExerciseSet(1, { reps: 10, loadKg: 50 })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const res = await req(global.trainer.token, trainingId3, exercise.id, {
      userId: global.athlete.uid,
      timestamp: addHours(new Date(), 1),
      reps: 12,
      repsR: 11,
      loadKg: 60,
      recTime: 0,
      // loadR should be provided
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      JSON.stringify([
        {
          field: 'loadKg',
          message:
            'Both primary and secondary side must be defined for param load in unilateral exercises',
        },
      ]),
    );

    await db.trainings.delete(trainingId3);
  });
});
