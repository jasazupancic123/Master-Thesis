import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import type { TestInstitution } from '@src/common/type/entity.type';
import type { Component } from '@src/component/entity/component.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { CompleteSetDto } from '@src/training/dto/complete-set.dto';
import type { Workload } from '@src/training/entity/workload.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { WorkloadService } from '@src/training/service/workload.service';

describe('Complete Next Set (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;
  let workloadService: WorkloadService;

  let institution: TestInstitution;
  let group: Group;
  let component1: Component;
  let trainingId: string;

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

    await app.close();
  });

  async function req(
    token: string,
    trainingId: string,
    componentId: string,
    exerciseId: string,
    supersetIndex: number,
    setNumber: number,
    body: CompleteSetDto,
  ) {
    return await request(app.getHttpServer())
      .post(
        `/training/${trainingId}/component/${componentId}/exercise/${exerciseId}/superset/${supersetIndex}/set/${setNumber}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  it('should fail if component does not exist', async () => {
    const res = await req(
      global.trainer.token,
      trainingId,
      'non-existing',
      'squat',
      0,
      1,
      { userId: global.athlete.uid, from: new Date(), to: new Date() },
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
      { userId: global.athlete.uid, from: new Date(), to: new Date() },
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
      { userId: global.athlete.uid, from: new Date(), to: new Date() },
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
      { userId: global.athlete.uid, from: new Date(), to: new Date() },
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
      { userId: global.athlete.uid, from: new Date(), to: new Date(), reps: 6 },
    );

    expect(res.status).toBe(201);
    const result = res.body as Workload;

    expect(result.trainingId).toBe(trainingId);
    expect(result.componentId).toBe(component1.id);
    expect(result.exerciseId).toBe('squat');
    expect(result.supersetIndex).toBe(0);
    expect(result.setNumber).toBe(1);
    expect(result.volWork1ValueL).toBe(6);
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
        volWork1ValueL: 6,
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
      { userId: global.athlete.uid, from: new Date(), to: new Date(), reps: 6 },
    );

    expect(res.status).toBe(201);
    const result = res.body as Workload;
    expect(result.id).toBe(workloadsBefore[0].id);

    const workloadsAfter = await db.workloads.getAll(trainingId);
    expect(workloadsAfter).toHaveLength(1);

    await db.workloads.deleteAll(trainingId);
  });
});
