import { TestApp } from '@test/common/utils/app.util';
import type * as request from 'supertest';

import type { ValidateRows } from '@src/common/type/validate.type';
import { GLOBAL_EXERCISE_OWNER } from '@src/exercise/constant/global-exercise-owner.constant';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { TestDbService } from '@src/test-db/test-db.service';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const warmup = generateComponentStub({ field: 'warmup' });
  const cooldown = generateComponentStub({ field: 'cooldown' });

  const c1 = generateComponentStub({
    field: 'c1',
    name: 'C1',
    params: ['reps', 'time', 'dist', 'loadKg'],
    options: [generateComponentStub({ field: 'leaf1', name: 'Leaf 1' })],
  });

  const c2 = generateComponentStub({
    field: 'c2',
    name: 'C2',
    params: ['loadKg', 'time'],
    options: [generateComponentStub({ field: 'leaf2', name: 'Leaf 2' })],
  });

  return {
    WARMUP_ID: 'warmup',
    COOLDOWN_ID: 'cooldown',
    WARMUP: warmup,
    COOLDOWN: cooldown,
    Components: [warmup, c1, c2, cooldown],
  };
});

describe('Upsert Many Exercises (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institutionId: string;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institutionId = await db.institutions.save(generateInstitutionStub());
  });

  afterEach(async () => db.exercises.clear());
  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(
    exercises: Exercise[],
    token: string,
  ): Promise<request.Response> {
    return await testApp.http.post(`/exercise/many`, token, { exercises });
  }

  describe('General Tests', () => {
    it('should fail if exercise does not have any components', async () => {
      const exercises = [
        generateExerciseStub({ name: 'deadlift', components: [] }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        JSON.stringify([
          {
            row: 1,
            errors: [
              {
                field: 'components',
                message: 'Attribute "Components" is required',
              },
            ],
          },
        ] as ValidateRows<Exercise>),
      );
    });

    it('should fail if component does not exist', async () => {
      const exercises = [
        generateExerciseStub({ components: ['non-existing-component-1'] }),
        generateExerciseStub({ components: ['c1:leaf1'] }),
        generateExerciseStub({ components: ['non-existing-component-2'] }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        JSON.stringify([
          {
            row: 1,
            errors: [
              {
                field: 'components',
                message:
                  'Value "non-existing-component-1" for attribute "Components" is not a valid option. Valid options are: warmup, c1, c2, cooldown',
              },
            ],
          },
          {
            row: 3,
            errors: [
              {
                field: 'components',
                message:
                  'Value "non-existing-component-2" for attribute "Components" is not a valid option. Valid options are: warmup, c1, c2, cooldown',
              },
            ],
          },
        ] as ValidateRows<Exercise>),
      );
    });

    it('should fail if main component is not leaf', async () => {
      const exercises = [
        generateExerciseStub({ name: 'deadlift', components: ['c1'] }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        JSON.stringify([
          {
            row: 1,
            errors: [
              {
                field: 'components',
                message:
                  'Option "c1" has nested options, please select one of the following: leaf1',
              },
            ],
          },
        ] as ValidateRows<Exercise>),
      );
    });

    it('should fail if exercise has invalid attribute values', async () => {
      const exercises = [
        generateExerciseStub({
          name: 'deadlift',
          components: ['c1:leaf1'],
          equipment: ['invalid-value'],
        }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(400);
      expect(JSON.parse(response.body.message)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            row: 1,
            errors: expect.arrayContaining([
              expect.objectContaining({
                field: 'equipment',
                message: expect.stringContaining(
                  'Value "invalid-value" for attribute "Equipment" is not a valid option. Valid options are:',
                ),
              }),
            ]),
          }),
        ]),
      );
    });

    it('should fail if multiple things are invalid', async () => {
      const exercises = [
        generateExerciseStub({
          name: 'deadlift',
          components: ['non-existing-component'],
          equipment: ['invalid-value'],
        }),
        generateExerciseStub({
          name: 'deadlift',
          components: ['c1:leaf1'],
        }), // will overwrite the previous one
        generateExerciseStub({
          name: 'squat',
          components: ['c1:leaf1'],
          equipment: ['cardio:invalid'],
        }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(400);

      expect(JSON.parse(response.body.message)).toEqual([
        {
          row: 1,
          errors: [
            {
              field: 'components',
              message:
                'Value "non-existing-component" for attribute "Components" is not a valid option. Valid options are: warmup, c1, c2, cooldown',
            },
          ],
        },
        {
          row: 3,
          errors: [
            {
              field: 'equipment',
              message:
                'Value "invalid" for attribute "Equipment" is not a valid option. Valid options are: treadmill, elliptical-trainer, stationary-bike, rowing-machine, stair-climber-stepper, spin-bike, air-bike, arc-trainer',
            },
          ],
        },
      ]);
    });
  });

  describe('Admin Tests', () => {
    it('should successfully create exercises', async () => {
      const exercises = [
        generateExerciseStub({
          name: 'deadlift',
          components: ['c1:leaf1'],
          equipment: ['cardio:treadmill', 'strength:barbells:olympic'],
          isUnilateral: true,
        }),
        generateExerciseStub({
          name: 'squat',
          components: ['c1:leaf1'],
          equipment: ['cardio:elliptical-trainer', 'strength:barbells:ez-bar'],
        }),
        generateExerciseStub({
          name: 'bench press',
          components: ['c1:leaf1'],
          equipment: [
            'cardio:air-bike',
            'strength:barbells:olympic',
            'strength:dumbbells:regular',
          ],
        }),
        generateExerciseStub({
          name: 'disabled exercise',
          components: ['c1:leaf1'],
          disabled: true,
        }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(201);
      expect(response.body.length).toBe(4);

      const dbExercises = await db.exercises.findAll();
      expect(dbExercises.length).toBe(4);

      const deadlift = dbExercises.find((e) => e.name === 'deadlift');
      expect(deadlift.params).toEqual([
        'reps',
        'repsR',
        'time',
        'timeR',
        'dist',
        'distR',
        'loadKg', // additional params for unilateral exercise
        'loadKgR',
      ]);
      expect(deadlift?.equipment).toEqual([
        'cardio:treadmill',
        'strength:barbells:olympic',
      ]);

      const squat = dbExercises.find((e) => e.name === 'squat');
      expect(squat.params).toEqual(['reps', 'time', 'dist', 'loadKg']);
      expect(squat?.equipment).toEqual([
        'cardio:elliptical-trainer',
        'strength:barbells:ez-bar',
      ]);

      const benchPress = dbExercises.find((e) => e.name === 'bench press');
      expect(benchPress.params).toEqual(['reps', 'time', 'dist', 'loadKg']);
      expect(benchPress?.equipment).toEqual([
        'cardio:air-bike',
        'strength:barbells:olympic',
        'strength:dumbbells:regular',
      ]);

      const disabledExercise = dbExercises.find(
        (e) => e.name === 'disabled exercise',
      );
      expect(disabledExercise.disabled).toBe(true);
    });

    it('should update existing exercises', async () => {
      const exercise = await db.exercises.createTest({
        ownerId: global.admin.uid,
        name: 'existing',
        components: ['c1:leaf1'],
        equipment: ['strength:barbells:olympic'],
        locations: ['gym'],
      });

      const exercises = [
        generateExerciseStub({
          name: exercise.name,
          components: ['c2:leaf2'],
          equipment: ['strength:dumbbells:regular'],
          locations: ['pitch'],
        }),
        generateExerciseStub({
          name: 'new exercise',
          components: ['c1:leaf1'],
          equipment: [],
        }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(201);
      expect(response.body.length).toBe(2);

      const dbExercises = await db.exercises.findAll();
      expect(dbExercises.length).toBe(2);

      const updatedExercise = dbExercises.find((e) => e.id === exercise.id);
      expect(updatedExercise?.name).toBe('existing');

      expect(updatedExercise?.equipment).toEqual([
        'strength:dumbbells:regular',
      ]);
      expect(updatedExercise?.locations).toEqual(['pitch']);

      const newExercise = dbExercises.find((e) => e.name === 'new exercise');
      expect(newExercise).toBeDefined();
      expect(newExercise?.equipment.length).toBe(0);
      expect(newExercise?.locations.length).toBe(0);
    });
  });

  describe('Manager Tests', () => {
    it('should fail to upsert if manager wants to upsert disabled exercise', async () => {
      const exercises = [
        generateExerciseStub({
          name: 'disabled exercise',
          components: ['c1:leaf1'],
          disabled: true,
        }),
      ];

      const response = await req(exercises, global.manager.token);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You cannot create disabled exercises',
      );
    });

    it('should upsert exercises for manager', async () => {
      const exercises = [
        generateExerciseStub({
          name: 'manager exercise',
          components: ['c1:leaf1'],
          equipment: ['strength:dumbbells:regular'],
        }),
      ];

      const response = await req(exercises, global.manager.token);
      expect(response.status).toBe(201);
      expect(response.body.length).toBe(1);

      const dbExercises = await db.exercises.findAll();
      expect(dbExercises.length).toBe(1);
      expect(dbExercises[0].name).toBe('manager exercise');
      expect(dbExercises[0].ownerId).toBe(global.manager.uid);
      expect(dbExercises[0].institutionId).toBe(institutionId);
      expect(dbExercises[0].id).toBe(
        `manager-exercise-${institutionId.toLowerCase()}`,
      );
    });

    it('should create exercise with the same name as global exercise because institution id is added', async () => {
      await db.exercises.createTest({
        name: 'squat',
        ownerId: global.GLOBAL_EXERCISE_OWNER,
        components: ['c1:leaf1'],
      });

      const exercises = [
        generateExerciseStub({ name: 'squat', components: ['c1:leaf1'] }),
      ];

      const response = await req(exercises, global.manager.token);
      expect(response.status).toBe(201);
      expect(response.body.length).toBe(1);

      const dbExercises = await db.exercises.findAll();
      expect(dbExercises.length).toBe(2); // One global and one manager exercise

      const globalExercise = dbExercises.find(
        (e) => e.ownerId === GLOBAL_EXERCISE_OWNER,
      );

      const managerExercise = dbExercises.find(
        (e) =>
          e.ownerId === global.manager.uid && e.institutionId === institutionId,
      );

      expect(globalExercise?.name).toBe('squat');
      expect(globalExercise?.id).toBe('squat');

      expect(managerExercise?.name).toBe('squat');
      expect(managerExercise?.id).toBe(`squat-${institutionId.toLowerCase()}`);
    });
  });
});
