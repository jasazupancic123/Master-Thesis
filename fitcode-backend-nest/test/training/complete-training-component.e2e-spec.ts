import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { addDays, addMinutes, subDays } from 'date-fns';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { ComponentService } from '../../src/component/component.service';
import {
  DEFAULT_PARAMS_KEY,
  PARAMS,
} from '../../src/component/constant/param.constant';
import { Component } from '../../src/component/entity/component.entity';
import {
  IntType,
  ParamType,
  VolType,
} from '../../src/component/enum/param.enum';
import { generateComponentParamsStub } from '../../src/component/mock/component-param.stub';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { Exercise } from '../../src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { Group } from '../../src/group/entity/group.entity';
import { GroupService } from '../../src/group/group.service';
import { generateCycleStub } from '../../src/group/mock/cycle.stub';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { Training } from '../../src/training/entity/training.entity';
import { ValidParams } from '../../src/training/interface/param-to-selected.interface';
import { generateCompletedTrainingExerciseStub } from '../../src/training/mock/completed-training.stub';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '../../src/training/mock/training.stub';
import { TrainingService } from '../../src/training/service/training.service';
import { TestInstitution } from '../common/type/entity.type';
import { createAthleteUserAndToken } from '../common/utils/auth.util';
import {
  createGroupWithCycles,
  createInstitution,
  deleteCollection,
  deleteDoc,
  deleteUsers,
} from '../common/utils/data.util';

describe('Complete training component (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let institutionService: InstitutionService;

  /**
   * First component has component params VolWorkSets, VolWork1, IntWork1
   */
  let component1: Component;

  /**
   * Second component has component params VolWorkSets, VolWork2, VolRec1
   */
  let component2: Component;
  let leaf1: Component;
  let leaf2: Component;

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

    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);

    component1 = await componentService.create(
      generateComponentStub({
        id: 'c1',
        params: {
          [DEFAULT_PARAMS_KEY]: generateComponentParamsStub([
            ParamType.VolWorkSets,
            ParamType.VolWork1,
            ParamType.IntWork1,
          ]),
        },
      }),
    );

    component2 = await componentService.create(
      generateComponentStub({
        id: 'c2',
        params: {
          [DEFAULT_PARAMS_KEY]: generateComponentParamsStub([
            ParamType.VolWorkSets,
            ParamType.VolWork2,
            ParamType.VolRec1,
          ]),
        },
      }),
    );

    leaf1 = await componentService.create(
      generateComponentStub({ id: 'leaf1', parentId: 'c1' }),
    );

    leaf2 = await componentService.create(
      generateComponentStub({ id: 'leaf2', parentId: 'c2' }),
    );

    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, institution);
    group = await groupService.update(
      global.trainer,
      { groupId: group.id },
      {
        cycles: [
          generateCycleStub({
            from: subDays(new Date(), 3),
            to: addDays(new Date(), 3),
          }),
        ],
      },
    );

    exercises = await exerciseService.createMany(global.admin, [
      generateExerciseStub({ name: 'Squat L1', componentIds: [leaf1.id] }),
      generateExerciseStub({ name: 'Bench L1', componentIds: [leaf1.id] }),
      generateExerciseStub({ name: 'Deadlift L1', componentIds: [leaf1.id] }),
      generateExerciseStub({ name: 'Squat L2', componentIds: [leaf2.id] }),
      generateExerciseStub({ name: 'Bench L2', componentIds: [leaf2.id] }),
      generateExerciseStub({ name: 'Deadlift L2', componentIds: [leaf2.id] }),
    ]);

    training = await trainingService.create(
      global.trainer,
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        membersIds: [global.athlete.uid],
        components: [
          generateTrainingComponent({
            from: new Date(),
            id: component1.id,
          }),
          generateTrainingComponent({
            from: addMinutes(new Date(), 30),
            id: component2.id,
          }),
        ],
      }),
    );

    training = await trainingService.update(
      global.trainer,
      { trainingId: training.id },
      {
        components: [
          generateTrainingComponent({
            from: new Date(),
            id: component1.id,
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
            from: addMinutes(new Date(), 30),
            id: component2.id,
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
  });

  afterAll(async () => {
    await Promise.all([
      deleteCollection(firebase, 'TRAINING'),
      deleteCollection(firebase, 'EXERCISE'),
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteCollection(firebase, 'COMPONENT'),
    ]);

    await app.close();
  });

  function url(trainingId: string, componentId: string) {
    return `/training/${trainingId}/component/${componentId}/complete`;
  }

  it('should throw error if training not found', async () => {
    const response = await request(app.getHttpServer())
      .patch(url('invalid-training-id', 'component-id'))
      .set('Authorization', `Bearer ${global.athlete.token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Training not found');
  });

  it('should throw error if training is in the future', async () => {
    const trainingTomorrow = await firebase.firestore
      .collection(FirestoreCollection.TRAINING)
      .add(generateTrainingStub({ from: addDays(new Date(), 2) }));

    const response = await request(app.getHttpServer())
      .patch(url(trainingTomorrow.id, 'component-id'))
      .set('Authorization', `Bearer ${global.athlete.token}`)
      .send({});

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('You cannot start this training');

    await deleteDoc(firebase, 'TRAINING', trainingTomorrow.id);
  });

  it('should throw error if training is in the future', async () => {
    const trainingYesterday = await firebase.firestore
      .collection(FirestoreCollection.TRAINING)
      .add(generateTrainingStub({ from: subDays(new Date(), 2) }));

    const response = await request(app.getHttpServer())
      .patch(url(trainingYesterday.id, 'component-id'))
      .set('Authorization', `Bearer ${global.athlete.token}`)
      .send({});

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('You cannot start this training');

    await deleteDoc(firebase, 'TRAINING', trainingYesterday.id);
  });

  it('should throw error if training component does not exist', async () => {
    const response = await request(app.getHttpServer())
      .patch(url(training.id, 'component-id'))
      .set('Authorization', `Bearer ${global.athlete.token}`)
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
    const c1ValidExerciseParamValues: ValidParams[] = [
      {
        field: ParamType.VolWork1,
        selected: VolType.Rep,
        value: 10,
      },
      {
        field: ParamType.IntWork1,
        selected: IntType.Kg,
        value: 60,
      },
    ];

    it.each([
      ['empty array', { correctExercise: 'Squat L1', supersetIndex: 1 }, []],
      [
        'invalid first exercise', // description of error
        {
          correctExercise: 'Squat L1', // correct exercise that should be provided
          supersetIndex: 1, // superset index in which the correct exercise is
        },
        [
          generateCompletedTrainingExerciseStub({
            id: 'deadlift-l1', // actual provided exercise
            supersetIndex: 0,
          }),
        ],
      ],
      [
        'valid exercise with wrong superset',
        { correctExercise: 'Squat L1', supersetIndex: 1 },
        [
          generateCompletedTrainingExerciseStub({
            id: 'squat-l1',
            supersetIndex: 1,
          }),
        ],
      ],
      [
        'invalid exercise in first superset',
        { correctExercise: 'Bench L1', supersetIndex: 1 },
        [
          generateCompletedTrainingExerciseStub({
            id: 'squat-l1',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub({
            id: 'deadlift-l1',
            supersetIndex: 0,
          }),
        ],
      ],
      [
        'invalid exercise in second superset',
        { correctExercise: 'Squat L1', supersetIndex: 2 },
        [
          generateCompletedTrainingExerciseStub({
            id: 'squat-l1',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub({
            id: 'bench-l1',
            supersetIndex: 0,
          }),
          generateCompletedTrainingExerciseStub({
            id: 'bench-l2',
            supersetIndex: 1,
          }),
        ],
      ],
    ])(
      'should throw error if any prescribed exercise in superset is omitted (%s)',
      async (_, { correctExercise, supersetIndex }, exercises) => {
        const response = await request(app.getHttpServer())
          .patch(url(training.id, component1.id))
          .set('Authorization', `Bearer ${global.athlete.token}`)
          .send({
            userId: global.athlete.uid,
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
          generateCompletedTrainingExerciseStub({
            id: 'squat-l1',
            supersetIndex: 0,
            sets: [
              generateExerciseSet(1, [
                {
                  field: ParamType.VolWork1,
                  selected: VolType.Rep,
                  value: 10,
                },
              ]),
            ], // incomplete (IntWork1 is missing)
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
          generateCompletedTrainingExerciseStub({
            id: 'squat-l1',
            supersetIndex: 0,
            sets: [generateExerciseSet(1, c1ValidExerciseParamValues)],
          }),
          generateCompletedTrainingExerciseStub({
            id: 'bench-l1',
            supersetIndex: 0,
            sets: [generateExerciseSet(1, c1ValidExerciseParamValues)],
          }),
          generateCompletedTrainingExerciseStub({
            id: 'squat-l1',
            supersetIndex: 1,
            sets: [generateExerciseSet(1, c1ValidExerciseParamValues)],
          }),
          generateCompletedTrainingExerciseStub({
            id: 'deadlift-l1',
            supersetIndex: 1,
            sets: [
              generateExerciseSet(1, [
                {
                  field: ParamType.IntWork1,
                  selected: IntType.Kg,
                  value: 60,
                },
              ]), // incomplete (VolWork1 is missing)
            ],
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
          .set('Authorization', `Bearer ${global.athlete.token}`)
          .send({
            userId: global.athlete.uid,
            exercises,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          `${invalidSetText} in exercise ${correctExercise} in superset ${supersetIndex + 1}`,
        );
      },
    );

    it('should successfully create all workloads (even for ignored sets)', async () => {
      const exercises = [
        generateCompletedTrainingExerciseStub({
          id: 'squat-l1',
          supersetIndex: 0,
          sets: [generateExerciseSet(1, [])],
        }),
        generateCompletedTrainingExerciseStub({
          id: 'bench-l1',
          supersetIndex: 0,
          sets: [generateExerciseSet(1, [])],
        }),
        generateCompletedTrainingExerciseStub({
          id: 'squat-l1',
          supersetIndex: 1,
          sets: [generateExerciseSet(1, [])],
        }),
        generateCompletedTrainingExerciseStub({
          id: 'deadlift-l1',
          supersetIndex: 1,
          sets: [generateExerciseSet(1, [])],
        }),
      ];

      /* const response = await request(app.getHttpServer())
        .patch(url(training.id, component1.id))
        .set('Authorization', `Bearer ${athlete.token}`)
        .send({
          userId: athlete.uid,
          exercises,
        });

      console */
    });
  });

  it('should successfully complete training component and update necessary relations', async () => {});
});
