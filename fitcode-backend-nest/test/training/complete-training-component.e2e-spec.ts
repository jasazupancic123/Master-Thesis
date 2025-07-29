import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  COMPONENT_PARAMS_OPT1,
  COMPONENT_PARAMS_OPT2,
} from '@test/common/constant/component-params.constant';
import { createAthleteUserAndToken } from '@test/common/utils/auth.util';
import {
  createGroupWithCycles,
  createInstitution,
  deleteCollection,
  deleteDoc,
  deleteUsers,
} from '@test/common/utils/data.util';
import { addDays, addHours, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { ComponentService } from '@src/component/component.service';
import { DEFAULT_PARAMS_KEY } from '@src/component/constant/param.constant';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import type { Component } from '@src/component/entity/component.entity';
import { IntType, ParamType } from '@src/component/enum/param.enum';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import { generateCompletedTrainingExerciseStub } from '@src/training/mock/completed-training.stub';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';
import { WorkloadService } from '@src/training/service/workload.service';

import type { TestUser } from '../common/type/auth.type';
import type { TestInstitution } from '../common/type/entity.type';

describe('Complete training component (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let institutionService: InstitutionService;
  let workloadService: WorkloadService;

  /**
   * First component has component params VolWorkSets, VolWork1, IntWork1
   */
  let component1: Component;

  /**
   * Second component has component params VolWorkSets, VolWork2, VolRec1
   */
  let component2: Component;

  let athlete1: TestUser;
  let athlete2: TestUser;
  let institution: TestInstitution;
  let group: Group;

  /**
   * ```txt
   * Training:
   *   1st component (component1):
   *     1st superset: squat l1 (partial params), bench l1 (partial params)
   *     2nd superset: squat l1, deadlift l1
   *   2st component (component2):
   *     1st superset: bench l2, deadlift l2
   *     2nd superset: squat l2
   * ```
   */
  let training: Training;
  let exercises: Exercise[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);
    workloadService = moduleFixture.get(WorkloadService);

    component1 = await componentService.create(
      generateComponentStub({
        id: 'c1',
        params: { [DEFAULT_PARAMS_KEY]: COMPONENT_PARAMS_OPT1 },
      }),
    );

    component2 = await componentService.create(
      generateComponentStub({
        id: 'c2',
        params: { [DEFAULT_PARAMS_KEY]: COMPONENT_PARAMS_OPT2 },
      }),
    );

    athlete1 = global.athlete;
    athlete2 = await createAthleteUserAndToken(firebase);

    institution = await createInstitution(institutionService, {
      athletes: [athlete1, athlete2],
    });

    group = await createGroupWithCycles(groupService, institution);

    exercises = await exerciseService.createMany(global.admin, [
      generateExerciseStub({ name: 'Squat L1', componentIds: [component1.id] }),
      generateExerciseStub({ name: 'Bench L1', componentIds: [component1.id] }),
      generateExerciseStub({
        name: 'Deadlift L1',
        componentIds: [component1.id],
      }),
      generateExerciseStub({ name: 'Squat L2', componentIds: [component2.id] }),
      generateExerciseStub({ name: 'Bench L2', componentIds: [component2.id] }),
      generateExerciseStub({
        name: 'Deadlift L2',
        componentIds: [component2.id],
      }),
    ]);

    training = await createTraining();
  });

  afterAll(async () => {
    await Promise.all([
      db.trainings.delete(),
      deleteCollection(firebase, 'EXERCISE'),
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteCollection(firebase, 'COMPONENT'),
      deleteUsers(firebase, [athlete2]),
    ]);

    await app.close();
  });

  async function createTraining(): Promise<Training> {
    if (training) await db.trainings.delete(training.id);

    const newTraining = await trainingService.create(
      global.trainer,
      generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        membersIds: [athlete1.uid, athlete2.uid],
        date: new Date(),
        components: [
          generateTrainingComponent({ id: component1.id }),
          generateTrainingComponent({ id: component2.id }),
        ],
      }),
    );

    return await trainingService.update(
      global.trainer,
      { trainingId: newTraining.id },
      {
        membersIds: [athlete1.uid, athlete2.uid],
        warmup: generateTrainingComponent({ id: WARMUP_COMPONENT_ID }),
        cooldown: generateTrainingComponent({ id: COOLDOWN_COMPONENT_ID }),
        components: [
          generateTrainingComponent({
            id: component1.id,
            from: new Date(),
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[1].id }),
                ],
              }),
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[2].id }),
                ],
              }),
            ],
          }),
          generateTrainingComponent({
            id: component2.id,
            from: addHours(new Date(), 1),
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[4].id }),
                  generateTrainingExercise({ id: exercises[5].id }),
                ],
              }),
              generateSuperset({
                exercises: [generateTrainingExercise({ id: exercises[3].id })],
              }),
            ],
          }),
        ],
      },
    );
  }

  function url(trainingId: string, componentId: string) {
    return `/training/${trainingId}/component/${componentId}/complete`;
  }

  it('should throw error if training not found', async () => {
    const response = await request(app.getHttpServer())
      .patch(url('invalid-training-id', 'component-id'))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Training not found');
  });

  it('should throw error if training is in the future', async () => {
    const trainingTomorrow = await db.trainings.create({
      ownerId: global.trainer.uid,
      membersIds: [athlete1.uid],
      date: addDays(new Date(), 1),
    });

    const response = await request(app.getHttpServer())
      .patch(url(trainingTomorrow.id, 'component-id'))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({});

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('You cannot start this training');

    await db.trainings.delete(trainingTomorrow.id);
  });

  it('should throw error if training is in the past', async () => {
    const trainingYesterday = await db.trainings.create({
      ownerId: global.trainer.uid,
      membersIds: [athlete1.uid],
      date: subDays(new Date(), 1),
    });

    const response = await request(app.getHttpServer())
      .patch(url(trainingYesterday.id, 'component-id'))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({});

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('You cannot start this training');

    await db.trainings.delete(trainingYesterday.id);
  });

  it('should throw error if training component does not exist', async () => {
    const response = await request(app.getHttpServer())
      .patch(url(training.id, 'component-id'))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({});

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Training component not found');
  });

  it.each([
    ['manager', global.manager.token],
    ['trainer', global.trainer.token],
  ])(
    'should throw error if current user is %s and does not provide athleteId',
    async (_, token) => {
      const response = await request(app.getHttpServer())
        .patch(url(training.id, component1.id))
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('You must provide athlete');
    },
  );

  it('should throw error if provided athlete does not exist', async () => {
    const response = await request(app.getHttpServer())
      .patch(url(training.id, component1.id))
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: 'unknown-athlete-id' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Athlete does not exist');
  });

  it('should throw error if provided athlete is not part of the institution', async () => {
    const newAthlete = await createAthleteUserAndToken(firebase);

    const response = await request(app.getHttpServer())
      .patch(url(training.id, component1.id))
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: newAthlete.uid });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      `Athlete ${newAthlete.email} cannot view institution ${institution.name}`,
    );

    await deleteUsers(firebase, [newAthlete]);
  });

  describe('Create Workloads', () => {
    it.each([
      ['empty array', { correctExercise: 'Squat L1', supersetIndex: 1 }, []],
      [
        'invalid first exercise', // description of error
        {
          correctExercise: 'Squat L1', // correct exercise that should be provided
          supersetIndex: 1, // superset index in which the correct exercise is
        },
        [
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'deadlift-l1', // actual provided exercise
            supersetIndex: 0,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
        ],
      ],
      [
        'valid exercise with wrong superset',
        { correctExercise: 'Squat L1', supersetIndex: 1 },
        [
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 1,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
        ],
      ],
      [
        'invalid exercise in first superset',
        { correctExercise: 'Bench L1', supersetIndex: 1 },
        [
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 0,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'deadlift-l1',
            supersetIndex: 0,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
        ],
      ],
      [
        'invalid exercise in second superset',
        { correctExercise: 'Squat L1', supersetIndex: 2 },
        [
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 0,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'bench-l1',
            supersetIndex: 0,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
          generateCompletedTrainingExerciseStub(component1, 2, {
            id: 'bench-l2',
            supersetIndex: 1,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
        ],
      ],
    ])(
      'should throw error if any prescribed exercise in superset is omitted (%s)',
      async (_, { correctExercise, supersetIndex }, exercises) => {
        const response = await request(app.getHttpServer())
          .patch(url(training.id, component1.id))
          .set('Authorization', `Bearer ${athlete1.token}`)
          .send({
            userId: athlete1.uid,
            exercises,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          `You have to complete prescribed exercise ${correctExercise} in superset ${supersetIndex}`,
        );
      },
    );

    it.each([
      [
        'completed exercise does not have the same parameters as prescribed (first superset)',
        {
          correctExercise: 'Squat L1',
          supersetIndex: 0,
          invalidSetText:
            'You have to complete parameter intensity (kilograms)',
        },
        [
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 0,
            customComponentParams: [COMPONENT_PARAMS_OPT1[1]], // incomplete (VolWorkSets is missing)
          }),
        ],
      ],
      [
        'completed exercise does not have the same parameters as prescribed (n-th superset)',
        {
          correctExercise: 'Deadlift L1',
          supersetIndex: 1,
          invalidSetText: 'You have to complete parameter volume (reps)',
        },
        [
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 0,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'bench-l1',
            supersetIndex: 0,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 1,
            customComponentParams: COMPONENT_PARAMS_OPT1,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'deadlift-l1',
            supersetIndex: 1,
            customComponentParams: [
              {
                field: ParamType.IntWork1,
                selected: IntType.Kg,
                value: '60',
              },
            ], // incomplete (VolWork1 is missing)
          }),
        ],
      ],
    ])(
      'should throw error if provided completed set does not equal prescribed set if %s',
      async (
        _,
        { correctExercise, supersetIndex, invalidSetText },
        exercises,
      ) => {
        const response = await request(app.getHttpServer())
          .patch(url(training.id, component1.id))
          .set('Authorization', `Bearer ${athlete1.token}`)
          .send({
            userId: athlete1.uid,
            exercises,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          `${invalidSetText} in exercise ${correctExercise} in superset ${supersetIndex + 1}`,
        );
      },
    );

    it('should successfully create all workloads and update training stats and completed members', async () => {
      const spy = jest.spyOn(workloadService, 'createForTrainingComponent');
      const response = await request(app.getHttpServer())
        .patch(url(training.id, component1.id))
        .set('Authorization', `Bearer ${global.athlete.token}`)
        .send({
          userId: global.athlete.uid,
          exercises: [
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'squat-l1',
              supersetIndex: 0,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'bench-l1',
              supersetIndex: 0,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'squat-l1',
              supersetIndex: 1,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'deadlift-l1',
              supersetIndex: 1,
            }),
          ],
        });

      const spyResult = await spy.mock.results[0].value;
      expect(response.status).toBe(200);
      expect(spyResult).toEqual(12); // 4 exercises * 3 sets each
      spy.mockRestore();

      const dbTraining = await db.trainings.get(training.id);
      const completedComponent = dbTraining.components.find(
        (c) => c.id === component1.id,
      );

      expect(completedComponent.completedMembersIds).toHaveLength(1);
      expect(completedComponent.completedMembersIds).toContain(
        global.athlete.uid,
      );
      expect(dbTraining.stats).toHaveLength(3); // 4 exercises but only 3 unique
      expect(dbTraining.completedMembersIds).toHaveLength(0);

      const workloads = await db.workloads.getAll(training.id);
      expect(workloads).toHaveLength(12); // 4 exercises * 3 sets

      await db.workloads.deleteAll(training.id);
    });
  });

  it.each([
    [global.athlete.token, 'You have already completed this component'], // athlete1 throws error, this is the same athlete
    [global.trainer.token, 'Athlete already completed this component'],
  ])(
    'should throw error if athlete already completed the component',
    async (token, message) => {
      training = await createTraining();

      const response1 = await request(app.getHttpServer())
        .patch(url(training.id, component1.id))
        .set('Authorization', `Bearer ${athlete1.token}`)
        .send({
          userId: athlete1.uid,
          exercises: [
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'squat-l1',
              supersetIndex: 0,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'bench-l1',
              supersetIndex: 0,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'squat-l1',
              supersetIndex: 1,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'deadlift-l1',
              supersetIndex: 1,
            }),
          ],
        });

      expect(response1.status).toBe(200);

      const response2 = await request(app.getHttpServer())
        .patch(url(training.id, component1.id))
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: athlete1.uid,
          exercises: [
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'squat-l1',
              supersetIndex: 0,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'bench-l1',
              supersetIndex: 0,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'squat-l1',
              supersetIndex: 1,
            }),
            generateCompletedTrainingExerciseStub(component1, 1, {
              id: 'deadlift-l1',
              supersetIndex: 1,
            }),
          ],
        });

      expect(response2.status).toBe(409);
      expect(response2.body.message).toBe(message);
    },
  );

  it('should update training stats when multiple athletes complete the same component', async () => {
    training = await createTraining();

    const exercises = [
      generateCompletedTrainingExerciseStub(component1, 1, {
        id: 'squat-l1',
        supersetIndex: 0,
      }),
      generateCompletedTrainingExerciseStub(component1, 1, {
        id: 'bench-l1',
        supersetIndex: 0,
      }),
      generateCompletedTrainingExerciseStub(component1, 1, {
        id: 'squat-l1',
        supersetIndex: 1,
      }),
      generateCompletedTrainingExerciseStub(component1, 1, {
        id: 'deadlift-l1',
        supersetIndex: 1,
      }),
    ];

    const response1 = await request(app.getHttpServer())
      .patch(url(training.id, component1.id))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({ userId: athlete1.uid, exercises });

    expect(response1.status).toBe(200);

    const response2 = await request(app.getHttpServer())
      .patch(url(training.id, component1.id))
      .set('Authorization', `Bearer ${athlete2.token}`)
      .send({ userId: athlete2.uid, exercises });

    expect(response2.status).toBe(200);

    const dbTraining = await db.trainings.get(training.id);
    const completedComponent = dbTraining.components.find(
      (c) => c.id === component1.id,
    );

    expect(completedComponent.completedMembersIds).toHaveLength(2);
    expect(completedComponent.completedMembersIds).toContain(athlete1.uid);
    expect(completedComponent.completedMembersIds).toContain(athlete2.uid);
    expect(dbTraining.stats).toHaveLength(3); // 4 exercises but only 3 unique
    expect(dbTraining.completedMembersIds).toHaveLength(0);

    const workloads = await db.workloads.getAll(training.id);
    expect(workloads).toHaveLength(24); // 12 * 2 athletes
  });

  it('should update stats correctly if multiple components are completed', async () => {
    training = await createTraining();

    // complete first component
    const response1 = await request(app.getHttpServer())
      .patch(url(training.id, component1.id))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({
        userId: athlete1.uid,
        exercises: [
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'bench-l1',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 1,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'deadlift-l1',
            supersetIndex: 1,
          }),
        ],
      });

    expect(response1.status).toBe(200);

    // complete second component
    const response2 = await request(app.getHttpServer())
      .patch(url(training.id, component2.id))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({
        userId: athlete1.uid,
        exercises: [
          generateCompletedTrainingExerciseStub(component2, 1, {
            id: 'bench-l2',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub(component2, 1, {
            id: 'deadlift-l2',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub(component2, 1, {
            id: 'squat-l2',
            supersetIndex: 1,
          }),
        ],
      });

    expect(response2.status).toBe(200);

    const dbTraining = await db.trainings.get(training.id);
    const completedComponent1 = dbTraining.components.find(
      (c) => c.id === component1.id,
    );
    const completedComponent2 = dbTraining.components.find(
      (c) => c.id === component2.id,
    );

    expect(completedComponent1.completedMembersIds).toHaveLength(1);
    expect(completedComponent1.completedMembersIds).toContain(athlete1.uid);
    expect(completedComponent2.completedMembersIds).toHaveLength(1);
    expect(completedComponent2.completedMembersIds).toContain(athlete1.uid);
    expect(dbTraining.completedMembersIds).toHaveLength(1);
    expect(dbTraining.stats).toHaveLength(6); // 6 unique exercises across both components

    const workloads = await db.workloads.getAll(training.id);
    expect(workloads).toHaveLength(21); // 1 athlete * 7 exercises (total) * 3 sets
  });

  it('should successfully complete training when all users complete all components', async () => {
    training = await createTraining();

    const exercises1 = [
      generateCompletedTrainingExerciseStub(component1, 1, {
        id: 'squat-l1',
        supersetIndex: 0,
      }),
      generateCompletedTrainingExerciseStub(component1, 1, {
        id: 'bench-l1',
        supersetIndex: 0,
      }),
      generateCompletedTrainingExerciseStub(component1, 1, {
        id: 'squat-l1',
        supersetIndex: 1,
      }),
      generateCompletedTrainingExerciseStub(component1, 1, {
        id: 'deadlift-l1',
        supersetIndex: 1,
      }),
    ];

    const exercises2 = [
      generateCompletedTrainingExerciseStub(component2, 1, {
        id: 'bench-l2',
        supersetIndex: 0,
      }),
      generateCompletedTrainingExerciseStub(component2, 1, {
        id: 'deadlift-l2',
        supersetIndex: 0,
      }),
      generateCompletedTrainingExerciseStub(component2, 1, {
        id: 'squat-l2',
        supersetIndex: 1,
      }),
    ];

    // Complete first component for athlete1
    const response1 = await request(app.getHttpServer())
      .patch(url(training.id, component1.id))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({
        userId: athlete1.uid,
        exercises: exercises1,
      });

    expect(response1.status).toBe(200);

    // Complete second component for athlete1
    const response2 = await request(app.getHttpServer())
      .patch(url(training.id, component2.id))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({
        userId: athlete1.uid,
        exercises: exercises2,
      });

    expect(response2.status).toBe(200);

    // Complete first component for athlete2
    const response3 = await request(app.getHttpServer())
      .patch(url(training.id, component1.id))
      .set('Authorization', `Bearer ${athlete2.token}`)
      .send({
        userId: athlete2.uid,
        exercises: exercises1,
      });

    expect(response3.status).toBe(200);

    // Complete second component for athlete2
    const response4 = await request(app.getHttpServer())
      .patch(url(training.id, component2.id))
      .set('Authorization', `Bearer ${athlete2.token}`)
      .send({
        userId: athlete2.uid,
        exercises: exercises2,
      });

    expect(response4.status).toBe(200);

    const dbTraining = await db.trainings.get(training.id);
    expect(dbTraining.components).toHaveLength(2);
    expect(dbTraining.completedMembersIds).toHaveLength(2);
    expect(dbTraining.completedMembersIds).toContain(athlete1.uid);
    expect(dbTraining.completedMembersIds).toContain(athlete2.uid);
    expect(dbTraining.stats).toHaveLength(6); // 6 unique exercises across both components
    expect(dbTraining.components[0].completedMembersIds).toHaveLength(2);
    expect(dbTraining.components[1].completedMembersIds).toHaveLength(2);

    const workloads = await db.workloads.getAll(training.id);
    expect(workloads).toHaveLength(42); // 2 athletes * 7 exercises (total) * 3 sets
  });

  it('should successfully complete training component for athlete with custom workloads', async () => {
    training = await createTraining();

    await db.workloads.createMany([
      {
        trainingId: training.id,
        component: component1,
        exerciseId: 'squat-l1',
        userId: athlete1.uid,
        supersetIndex: 0,
        setNumber: 1,
        prescribedIntRecValueL: 101,
        status: SetStatus.NOT_STARTED,
      },
      {
        trainingId: training.id,
        component: component1,
        exerciseId: 'bench-l1',
        userId: athlete1.uid,
        supersetIndex: 0,
        setNumber: 1,
        prescribedIntRecValueR: 98,
        status: SetStatus.NOT_STARTED,
      },
    ]);

    const existingWorkloads = await db.workloads.getAll(training.id);
    expect(existingWorkloads).toHaveLength(2);

    const existingSquatWorkload = existingWorkloads.find(
      (w) => w.exerciseId === 'squat-l1',
    );
    const existingBenchWorkload = existingWorkloads.find(
      (w) => w.exerciseId === 'bench-l1',
    );

    expect(existingSquatWorkload).toBeDefined();
    expect(existingSquatWorkload.prescribedIntRecValueL).toBe(101);
    expect(existingBenchWorkload).toBeDefined();
    expect(existingBenchWorkload.prescribedIntRecValueR).toBe(98);

    const spy = jest.spyOn(workloadService, 'getPrescribedWorkload');
    const response = await request(app.getHttpServer())
      .patch(url(training.id, component1.id))
      .set('Authorization', `Bearer ${athlete1.token}`)
      .send({
        userId: athlete1.uid,
        exercises: [
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'squat-l1',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub(component1, 1, {
            id: 'bench-l1',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub(component1, 2, {
            id: 'squat-l1',
            supersetIndex: 1,
          }),
          generateCompletedTrainingExerciseStub(component1, 2, {
            id: 'deadlift-l1',
            supersetIndex: 1,
          }),
        ],
      });

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(10); // 12 workloads in total, but 2 already exist, so 10
    spy.mockRestore();

    const workloads = await db.workloads.getAll(training.id);
    expect(workloads).toHaveLength(12); // 4 exercises * 3 sets

    const squatSuperset0Workload = workloads
      .filter(
        (w) =>
          w.exerciseId === 'squat-l1' &&
          w.userId === athlete1.uid &&
          w.supersetIndex === 0,
      )
      .sort((a, b) => a.setNumber - b.setNumber);

    const benchSuperset0Workload = workloads
      .filter(
        (w) =>
          w.exerciseId === 'bench-l1' &&
          w.userId === athlete1.uid &&
          w.supersetIndex === 0,
      )
      .sort((a, b) => a.setNumber - b.setNumber);

    const squatSuperset1Workload = workloads
      .filter(
        (w) =>
          w.exerciseId === 'squat-l1' &&
          w.userId === athlete1.uid &&
          w.supersetIndex === 1,
      )
      .sort((a, b) => a.setNumber - b.setNumber);

    const deadliftSuperset1Workload = workloads
      .filter(
        (w) =>
          w.exerciseId === 'deadlift-l1' &&
          w.userId === athlete1.uid &&
          w.supersetIndex === 1,
      )
      .sort((a, b) => a.setNumber - b.setNumber);

    expect(squatSuperset0Workload).toHaveLength(3);
    expect(benchSuperset0Workload).toHaveLength(3);
    expect(squatSuperset1Workload).toHaveLength(3);
    expect(deadliftSuperset1Workload).toHaveLength(3);

    expect(squatSuperset0Workload[0].prescribedIntRecValueL).toBe(101);
    expect(squatSuperset0Workload[1].prescribedIntRecValueL).not.toBeDefined();
    expect(squatSuperset0Workload[2].prescribedIntRecValueL).not.toBeDefined();
    expect(benchSuperset0Workload[0].prescribedIntRecValueR).toBe(98);
    expect(benchSuperset0Workload[1].prescribedIntRecValueR).not.toBeDefined();
    expect(benchSuperset0Workload[2].prescribedIntRecValueR).not.toBeDefined();
    expect(squatSuperset1Workload[0].prescribedIntRecValueL).not.toBeDefined();
    expect(squatSuperset1Workload[1].prescribedIntRecValueL).not.toBeDefined();
    expect(squatSuperset1Workload[2].prescribedIntRecValueL).not.toBeDefined();
    expect(
      deadliftSuperset1Workload[0].prescribedIntRecValueL,
    ).not.toBeDefined();
    expect(
      deadliftSuperset1Workload[1].prescribedIntRecValueL,
    ).not.toBeDefined();
    expect(
      deadliftSuperset1Workload[2].prescribedIntRecValueL,
    ).not.toBeDefined();
  });
});
