import { TestApp } from '@test/common/utils/app.util';
import type * as request from 'supertest';

import type { ValidateRows } from '@src/common/type/validate.type';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { GLOBAL_EXERCISE_OWNER } from '@src/exercise/constant/global-exercise-owner.constant';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Upsert Many Exercises (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institutionId: string;
  let component: Component;
  let root: Component;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    institutionId = await db.institutions.save(generateInstitutionStub());

    root = await db.components.create(
      generateComponentStub({ params: ['reps', 'time', 'dist', 'loadKg'] }),
    );

    component = await db.components.create(
      generateComponentStub({ parentId: root.id }),
    );
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
        generateExerciseStub({ name: 'deadlift', componentIds: [] }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        JSON.stringify([
          {
            row: 1,
            errors: [
              {
                field: 'componentIds',
                message: 'Exercise must have at least one component',
              },
            ],
          },
        ] as ValidateRows<Exercise>),
      );
    });

    it('should fail if component does not exist', async () => {
      const exercises = [
        generateExerciseStub({ componentIds: ['non-existing-component-1'] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: ['non-existing-component-2'] }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        JSON.stringify([
          {
            row: 1,
            errors: [
              {
                field: 'componentIds',
                message: 'Component non-existing-component-1 does not exist',
              },
            ],
          },
          {
            row: 3,
            errors: [
              {
                field: 'componentIds',
                message: 'Component non-existing-component-2 does not exist',
              },
            ],
          },
        ] as ValidateRows<Exercise>),
      );
    });

    it('should fail if main component is not leaf', async () => {
      const root = await db.components.create();
      await db.components.create({ parentId: root.id });

      const exercises = [
        generateExerciseStub({ name: 'deadlift', componentIds: [root.id] }),
      ];

      const response = await req(exercises, global.admin.token);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        JSON.stringify([
          {
            row: 1,
            errors: [
              {
                field: 'componentIds',
                message: `Main component ${root.name.toLowerCase()} is not valid for an exercise`,
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
          componentIds: [component.id],
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
          componentIds: ['non-existing-component'],
          equipment: ['invalid-value'],
        }),
        generateExerciseStub({
          name: 'deadlift',
          componentIds: [component.id],
        }), // will overwrite the previous one
        generateExerciseStub({
          name: 'squat',
          componentIds: [component.id],
          equipment: ['cardio:invalid'],
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
                field: 'componentIds',
                message: 'Component non-existing-component does not exist',
              }),
            ]),
          }),
        ]),
      );
    });
  });

  describe('Admin Tests', () => {
    it('should successfully create exercises', async () => {
      const exercises = [
        generateExerciseStub({
          name: 'deadlift',
          componentIds: [component.id],
          equipment: ['cardio:treadmill', 'strength:barbells:olympic'],
          isUnilateral: true,
        }),
        generateExerciseStub({
          name: 'squat',
          componentIds: [component.id],
          equipment: ['cardio:elliptical-trainer', 'strength:barbells:ez-bar'],
        }),
        generateExerciseStub({
          name: 'bench press',
          componentIds: [component.id],
          equipment: [
            'cardio:air-bike',
            'strength:barbells:olympic',
            'strength:dumbbells:regular',
          ],
        }),
        generateExerciseStub({
          name: 'disabled exercise',
          componentIds: [component.id],
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
        'dist',
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
      const newRoot = await db.components.create(
        generateComponentStub({ params: ['loadKg', 'time'] }),
      );

      const newLeaf = await db.components.create(
        generateComponentStub({ parentId: newRoot.id }),
      );

      const exercise = await db.exercises.createTest({
        ownerId: global.admin.uid,
        name: 'existing',
        componentIds: [component.id],
        equipment: ['strength:barbells:olympic'],
        locations: ['gym'],
      });

      const exercises = [
        generateExerciseStub({
          name: exercise.name,
          componentIds: [newLeaf.id],
          equipment: ['strength:dumbbells:regular'],
          locations: ['pitch'],
        }),
        generateExerciseStub({
          name: 'new exercise',
          componentIds: [component.id],
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
          componentIds: [component.id],
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
          componentIds: [component.id],
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
        componentIds: [component.id],
      });

      const exercises = [
        generateExerciseStub({
          name: 'squat',
          componentIds: [component.id],
        }),
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
