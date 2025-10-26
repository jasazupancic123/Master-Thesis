import { TestApp } from '@test/common/utils/app.util';

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
import { SetStatus } from '@src/training/enum/set-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

describe('Upsert Set (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;
  let component1: Component;
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
      db.components.clear(),
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

  it('should fail if component does not exist', async () => {
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
  });

  it('should fail if superset does not exist', async () => {
    const res = await req(
      global.trainer.token,
      trainingId,
      component1.id,
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
  });

  it('should fail if exercise not found in training', async () => {
    const res = await req(
      global.trainer.token,
      trainingId,
      component1.id,
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
    expect(res.body.message).toBe('Exercise not found in training');
  });

  it('should fail if set number not found in exercise', async () => {
    const res = await req(
      global.trainer.token,
      trainingId,
      component1.id,
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
  });

  it('should successfully create a set', async () => {
    const res = await req(
      global.trainer.token,
      trainingId,
      component1.id,
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
    expect(result.componentId).toBe(component1.id);
    expect(result.exerciseId).toBe('squat');
    expect(result.supersetIndex).toBe(0);
    expect(result.setNumber).toBe(1);
    expect(result.reps).toBe(6);

    await db.workloads.deleteAll(trainingId);
  });

  it('should successfully update a set', async () => {
    await db.workloads.createMany([
      {
        trainingId,
        component: component1,
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
      component1.id,
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
  });

  it('should be able to insert all possible properties', async () => {
    const res = await req(
      global.trainer.token,
      trainingId,
      component1.id,
      'squat',
      0,
      1,
      {
        userId: global.athlete.uid,
        timestamp: new Date(),
        recTime: 60,
        reps: 6,
        repsR: 5,
        loadKg: 60,
        loadKgR: 50,
        tempo: '2.1:5.1:3.2:0.1',
        tempoR: '3.1:0.1:2.2:4.1',
        tempos: ['2.1:5.1:3.2:0.1', '3.1:0.1:2.2:4.1', '2.1:5.1:3.2:0.1'],
        temposR: ['3.1:0.1:2.2:4.1', '2.1:5.1:3.2:0.1', '3.1:0.1:2.2:4.1'],
        vel: 0.5,
        velR: 0.4,
        velocities: [0.5, 0.4, 0.45],
        velocitiesR: [0.4, 0.5, 0.55],
        rom: 50,
        romR: 45,
        roms: [50, 48, 52],
        romsR: [45, 47, 44],
        feedback: ['Felt good', 'Could be better'],
        feedbackR: ['Left side weak'],
        rir: 2,
        rirR: 3,
        notes: 'some notes',
        dist: 50,
        eff: 1,
        photoURLs: ['url1', 'url2', 'url3'],
        recDist: 500,
        time: 300,
      },
    );

    expect(res.status).toBe(201);
    const result = res.body as Workload;

    expect(result.trainingId).toBe(trainingId);
    expect(result.componentId).toBe(component1.id);
    expect(result.exerciseId).toBe('squat');
    expect(result.supersetIndex).toBe(0);
    expect(result.setNumber).toBe(1);

    expect(result.reps).toBe(6);
    expect(result.repsR).toBe(5);
    expect(result.loadKg).toBe(60);
    expect(result.loadKgR).toBe(50);
    expect(result.recTime).toBe(60);
    expect(result.tempo).toBe('2.1:5.1:3.2:0.1');
    expect(result.tempoR).toBe('3.1:0.1:2.2:4.1');
    expect(result.tempos).toEqual([
      '2.1:5.1:3.2:0.1',
      '3.1:0.1:2.2:4.1',
      '2.1:5.1:3.2:0.1',
    ]);
    expect(result.temposR).toEqual([
      '3.1:0.1:2.2:4.1',
      '2.1:5.1:3.2:0.1',
      '3.1:0.1:2.2:4.1',
    ]);
    expect(result.vel).toBe(0.5);
    expect(result.velR).toBe(0.4);
    expect(result.velocities).toEqual([0.5, 0.4, 0.45]);
    expect(result.velocitiesR).toEqual([0.4, 0.5, 0.55]);
    expect(result.rom).toBe(50);
    expect(result.romR).toBe(45);
    expect(result.roms).toEqual([50, 48, 52]);
    expect(result.romsR).toEqual([45, 47, 44]);
    expect(result.feedback).toEqual(['Felt good', 'Could be better']);
    expect(result.feedbackR).toEqual(['Left side weak']);
    expect(result.rir).toBe(2);
    expect(result.rirR).toBe(3);
    expect(result.notes).toBe('some notes');
    expect(result.dist).toBe(50);
    expect(result.eff).toBe(1);
    expect(result.photoURLs).toEqual(['url1', 'url2', 'url3']);
    expect(result.recDist).toBe(500);
    expect(result.time).toBe(300);

    await db.workloads.deleteAll(trainingId);
  });
});
