import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { COMPONENT_PARAMS_OPT1 } from '@test/common/constant/component-params.constant';
import { addHours, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import type { TestInstitution } from '@src/common/type/entity.type';
import type { Component } from '@src/component/entity/component.entity';
import { IntType, ParamType, VolType } from '@src/component/enum/param.enum';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { CompleteSetDto } from '@src/training/dto/complete-set.dto';
import type { Workload } from '@src/training/entity/workload.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import { generateParamAttributeValue } from '@src/training/mock/param-values.stub';
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
  let app: INestApplication;
  let db: TestDbService;
  let workloadService: WorkloadService;

  let institution: TestInstitution;
  let group: Group;
  let component1: Component;
  let trainingId: string;

  function generateSet(setNumber: number, isUnilateral = true) {
    const set = generateExerciseSet(setNumber, COMPONENT_PARAMS_OPT1);
    if (isUnilateral) set.paramValuesR = undefined;
    return set;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    workloadService = moduleFixture.get(WorkloadService);
    const exerciseService = moduleFixture.get(ExerciseService);
    await app.init();

    db = moduleFixture.get(TestDbService);
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
                    sets: [generateSet(1)],
                  }),
                  generateTrainingExercise({
                    id: 'bench',
                    sets: [generateSet(1), generateSet(2)],
                  }),
                ],
              }),
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift',
                    sets: [generateSet(1), generateSet(2), generateSet(3)],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [generateSet(1), generateSet(2)],
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
                    sets: [generateSet(1), generateSet(2), generateSet(3)],
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

    await app.close();
  });

  async function req(
    token: string,
    trainingId: string,
    exerciseId: string,
    body: CompleteSetDto,
  ) {
    return await request(app.getHttpServer())
      .post(`/training/${trainingId}/exercise/${exerciseId}/complete-next-set`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  it('should throw error if training not found', async () => {
    const res = await req(
      global.trainer.token,
      'invalid-training-id',
      'invalid-exercise-id',
      {
        userId: global.athlete.uid,
        from: new Date(),
        to: new Date(),
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
      const trainingService = app.get(TrainingService);
      const spy = jest.spyOn(trainingService as any, 'getAthlete');

      await req(token, trainingId, 'invalid-exercise-id', {
        userId: global.athlete.uid,
        from: new Date(),
        to: new Date(),
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
        from: new Date(),
        to: new Date(),
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
      from: new Date(),
      to: new Date(),
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
      from: new Date(),
      to: new Date(),
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Training is not scheduled for today');
  });

  it('should complete first set of exercise (when no workloads are in the database)', async () => {
    const from = new Date();
    const spy = jest.spyOn(workloadService, 'findAllByUserTraining');
    const res = await req(global.trainer.token, trainingId, 'squat', {
      userId: global.athlete.uid,
      from,
      to: addHours(from, 1),
      notes: 'left hip too low',
      reps: 12,
      load: 100,
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
    expect(new Date(result.plannedAt).getTime()).toBe(from.getTime());
    expect(result.status).toBe(SetStatus.OVER);
    expect(result.notes).toBe('left hip too low');

    // prescribed workload
    expect(result.volWork1Type).toBe('rep');
    expect(result.prescribedVolWork1ValueL).toBe(10);
    expect(result.prescribedVolWork1ValueR).toBeUndefined();
    expect(result.intWork1Type).toBe('kg');
    expect(result.prescribedIntWork1ValueL).toBe(50);
    expect(result.prescribedIntWork1ValueR).toBeUndefined();

    // completed workload
    expect(result.volWork1ValueL).toBe(12);
    expect(result.volWork1ValueR).toBeUndefined();
    expect(result.intWork1ValueL).toBe(100);
    expect(result.intWork1ValueR).toBeUndefined();
    // additional properties - tempo and rom
    expect(result.volWork2ValueL).toBe(2020);
    expect(result.volWork2ValueR).toBeUndefined();
    expect(result.volRecValueL).toBe(60);
    expect(result.volRecValueR).toBe(60);

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
      },
    ]);

    const from = new Date();
    const spy = jest.spyOn(workloadService, 'findAllByUserTraining');
    const res = await req(global.trainer.token, trainingId, 'squat', {
      userId: global.athlete.uid,
      from,
      to: addHours(from, 1),
      reps: 10,
      load: 80,
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
    expect(new Date(result.plannedAt).getTime()).toBe(from.getTime());
    expect(result.status).toBe(SetStatus.OVER);
    expect(result.notes).toBeUndefined();

    // prescribed workload
    expect(result.volWork1Type).toBe('rep');
    expect(result.prescribedVolWork1ValueL).toBe(10);
    expect(result.prescribedVolWork1ValueR).toBeUndefined();
    expect(result.intWork1Type).toBe('kg');
    expect(result.prescribedIntWork1ValueL).toBe(50);
    expect(result.prescribedIntWork1ValueR).toBeUndefined();

    // completed workload
    expect(result.volWork1ValueL).toBe(10);
    expect(result.volWork1ValueR).toBeUndefined();
    expect(result.intWork1ValueL).toBe(80);
    expect(result.intWork1ValueR).toBeUndefined();
    // additional properties - tempo and rom
    expect(result.volWork2ValueL).toBe(2020);
    expect(result.volWork2ValueR).toBeUndefined();
    expect(result.volRecValueL).toBe(90);
    expect(result.volRecValueR).toBe(90);

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
      })),
    );

    const from = new Date();
    const res = await req(global.trainer.token, trainingId, 'squat', {
      userId: global.athlete.uid,
      from,
      to: addHours(from, 1),
      reps: 8,
      load: 60,
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
                          generateExerciseSet(1, [
                            generateParamAttributeValue({
                              field: ParamType.VolWork1,
                              selected: VolType.Rep,
                              value: 5,
                            }),
                            generateParamAttributeValue({
                              field: ParamType.IntWork1,
                              selected: IntType.Rm,
                              value: 80, // 80% of RM
                            }),
                          ]),
                          generateExerciseSet(2, [
                            generateParamAttributeValue({
                              field: ParamType.VolWork1,
                              selected: VolType.Rep,
                              value: 5,
                            }),
                            generateParamAttributeValue({
                              field: ParamType.IntWork1,
                              selected: IntType.Bw,
                              value: 85, // 85% of BW
                            }),
                          ]),
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
        volWork1ValueL: 1, // 1 rep
        intWork1ValueL: 120, // 120 kg
      },
    ]);

    const from = new Date();
    const res1 = await req(global.trainer.token, trainingId2, 'squat', {
      userId: global.athlete.uid,
      from,
      to: addHours(from, 1),
      reps: 6,
      load: 90,
    });

    expect(res1.status).toBe(201);
    const result1 = res1.body as Workload;

    // reps
    expect(result1.prescribedVolWork1ValueL).toBe(5);
    expect(result1.volWork1ValueL).toBe(6);
    expect(result1.volWork1ValueR).toBeUndefined();

    // rm
    expect(result1.prescribedIntWork1ValueL).toBeLessThan(100); // 80% of 120 kg
    expect(result1.intWork1ValueL).toBe(90);
    expect(result1.intWork1ValueR).toBeUndefined();

    const res2 = await req(global.trainer.token, trainingId2, 'squat', {
      userId: global.athlete.uid,
      from,
      to: addHours(from, 1),
      reps: 4,
      load: 70,
    });

    expect(res2.status).toBe(201);
    const result2 = res2.body as Workload;

    // reps
    expect(result2.prescribedVolWork1ValueL).toBe(5);
    expect(result2.volWork1ValueL).toBe(4);
    expect(result2.volWork1ValueR).toBeUndefined();

    // bw
    expect(result2.prescribedIntWork1ValueL).toBeCloseTo(66.5); // 85% of 78.5 kg, rounded to first 0.25 kg
    expect(result2.intWork1ValueL).toBe(70);
    expect(result2.intWork1ValueR).toBeUndefined();

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
                    sets: [generateExerciseSet(1, COMPONENT_PARAMS_OPT1)],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const from = new Date();
    const res = await req(global.trainer.token, trainingId3, exercise.id, {
      userId: global.athlete.uid,
      from,
      to: addHours(from, 1),
      reps: 12,
      repsR: 11,
      load: 60,
      // loadR should be provided
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(`Both sides must be filled for load or none`);

    await db.trainings.delete(trainingId3);
  });
});
