import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { generateExerciseAttributeValueStub } from '@src/attribute/mock/attribute-value.stub';
import { AttributeType } from '@src/common/enum/attribute-type.enum';
import type { ValidateRows } from '@src/common/type/validate.type';
import type { Component } from '@src/component/entity/component.entity';
import { GLOBAL_EXERCISE_OWNER } from '@src/exercise/constant/global-exercise-owner.constant';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Upsert Many Exercises (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let institutionId: string;
  let component: Component;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = app.get(TestDbService);

    // create attributes
    await db.attributes.createMany([
      {
        field: 'eq',
        name: 'Equipment',
        type: AttributeType.Select,
        options: [
          { field: 'barbell', name: 'Barbell', type: AttributeType.Value },
          { field: 'dumbbell', name: 'Dumbbell', type: AttributeType.Value },
        ],
      },
      {
        field: 'muscle',
        name: 'Muscle',
        type: AttributeType.Select,
        options: [
          { field: 'chest', name: 'Chest', type: AttributeType.Value },
          { field: 'back', name: 'Back', type: AttributeType.Value },
          { field: 'legs', name: 'Legs', type: AttributeType.Value },
        ],
      },
      { field: 'isCool', name: 'Movement', type: AttributeType.Boolean },
    ]);

    institutionId = await db.institutions.addDoc(generateInstitutionStub());
    component = await db.components.create({
      attributes: ['eq', 'muscle', 'isCool'],
    });
  });

  afterEach(async () => db.exercises.clear());

  afterAll(async () => {
    await db.cleanup();
    await app.close();
  });

  describe('General Tests', () => {
    it('should fail if exercise does not have any components', async () => {
      const exercises = [
        generateExerciseStub({ name: 'deadlift', componentIds: [] }),
      ];

      const response = await request(app.getHttpServer())
        .post('/exercise/many')
        .set('Authorization', `Bearer ${global.admin.token}`)
        .send({ exercises });

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

      const response = await request(app.getHttpServer())
        .post('/exercise/many')
        .set('Authorization', `Bearer ${global.admin.token}`)
        .send({ exercises });

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
      const _leaf = await db.components.create({ parentId: root.id });

      const exercises = [
        generateExerciseStub({ name: 'deadlift', componentIds: [root.id] }),
      ];

      const response = await request(app.getHttpServer())
        .post('/exercise/many')
        .set('Authorization', `Bearer ${global.admin.token}`)
        .send({ exercises });

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
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: 'eq',
              value: 'invalid-value',
            }),
          ],
        }),
      ];

      const response = await request(app.getHttpServer())
        .post('/exercise/many')
        .set('Authorization', `Bearer ${global.admin.token}`)
        .send({ exercises });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        JSON.stringify([
          {
            row: 1,
            errors: [
              {
                field: 'attributeValues',
                message:
                  'Value "invalid-value" for attribute "Equipment" is not a valid option. Valid options are: barbell, dumbbell',
              },
            ],
          },
        ] as ValidateRows<Exercise>),
      );
    });

    it('should fail if multiple things are invalid', async () => {
      const exercises = [
        generateExerciseStub({
          name: 'deadlift',
          componentIds: ['non-existing-component'],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: 'eq',
              value: 'invalid-value',
            }),
          ],
        }),
        generateExerciseStub({
          name: 'deadlift',
          componentIds: [component.id],
        }), // will overwrite the previous one
        generateExerciseStub({
          name: 'squat',
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: 'eq',
              value: 'barbell',
            }),
          ],
        }),
        generateExerciseStub({
          name: 'bench press',
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: 'isCool',
              value: 'not-a-boolean',
            }),
          ],
        }),
        generateExerciseStub({
          name: 'shoulder press',
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: 'eq',
              value: 'invalid-value',
            }),
          ],
        }),
      ];

      const response = await request(app.getHttpServer())
        .post('/exercise/many')
        .set('Authorization', `Bearer ${global.admin.token}`)
        .send({ exercises });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        JSON.stringify([
          {
            row: 1,
            errors: [
              {
                field: 'componentIds',
                message: 'Component non-existing-component does not exist',
              },
            ],
          },
          {
            row: 4,
            errors: [
              {
                field: 'attributeValues',
                message: 'Value for attribute "Movement" must be a boolean',
              },
            ],
          },
          {
            row: 5,
            errors: [
              {
                field: 'attributeValues',
                message:
                  'Value "invalid-value" for attribute "Equipment" is not a valid option. Valid options are: barbell, dumbbell',
              },
            ],
          },
        ] as ValidateRows<Exercise>),
      );
    });
  });

  describe('Admin Tests', () => {
    it('should successfully create exercises', async () => {
      const eqBarbell = generateExerciseAttributeValueStub({
        field: 'eq',
        value: 'barbell',
      });

      const eqDumbbell = generateExerciseAttributeValueStub({
        field: 'eq',
        value: 'dumbbell',
      });

      const exercises = [
        generateExerciseStub({
          name: 'deadlift',
          componentIds: [component.id],
          attributeValues: [eqBarbell],
        }),
        generateExerciseStub({
          name: 'squat',
          componentIds: [component.id],
          attributeValues: [eqBarbell],
        }),
        generateExerciseStub({
          name: 'bench press',
          componentIds: [component.id],
          attributeValues: [eqDumbbell],
        }),
      ];

      const response = await request(app.getHttpServer())
        .post(`/exercise/many`)
        .set('Authorization', `Bearer ${global.admin.token}`)
        .send({ exercises });

      expect(response.status).toBe(201);
      expect(response.body.length).toBe(3);

      const dbExercises = await db.exercises.getAll();
      expect(dbExercises.length).toBe(3);

      const deadlift = dbExercises.find((e) => e.name === 'deadlift');
      expect(deadlift?.attributeValues[0].field).toBe(eqBarbell.field);
      expect(deadlift?.attributeValues[0].value).toBe(eqBarbell.value);

      const squat = dbExercises.find((e) => e.name === 'squat');
      expect(squat?.attributeValues[0].field).toBe(eqBarbell.field);
      expect(squat?.attributeValues[0].value).toBe(eqBarbell.value);

      const benchPress = dbExercises.find((e) => e.name === 'bench press');
      expect(benchPress?.attributeValues[0].field).toBe(eqDumbbell.field);
      expect(benchPress?.attributeValues[0].value).toBe(eqDumbbell.value);
    });

    it('should update existing exercises', async () => {
      const exercise = await db.exercises.create({
        ownerId: global.admin.uid,
        name: 'existing',
        componentIds: [component.id],
        attributeValues: [
          generateExerciseAttributeValueStub({ field: 'eq', value: 'barbell' }),
          generateExerciseAttributeValueStub({
            field: 'muscle',
            value: 'chest',
          }),
        ],
      });

      expect(exercise.attributeValues.length).toBe(2);

      const exercises = [
        generateExerciseStub({
          name: exercise.name,
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: 'eq',
              value: 'dumbbell',
            }),
            generateExerciseAttributeValueStub({
              field: 'muscle',
              value: 'back',
            }),
          ],
        }),
        generateExerciseStub({
          name: 'new exercise',
          componentIds: [component.id],
          attributeValues: [],
        }),
      ];

      const response = await request(app.getHttpServer())
        .post(`/exercise/many`)
        .set('Authorization', `Bearer ${global.admin.token}`)
        .send({ exercises });

      expect(response.status).toBe(201);
      expect(response.body.length).toBe(2);

      const dbExercises = await db.exercises.getAll();
      expect(dbExercises.length).toBe(2);

      const updatedExercise = dbExercises.find((e) => e.id === exercise.id);
      expect(updatedExercise?.name).toBe('existing');
      expect(updatedExercise?.attributeValues.length).toBe(2);

      expect(updatedExercise?.attributeValues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'eq', value: 'dumbbell' }),
          expect.objectContaining({ field: 'muscle', value: 'back' }),
        ]),
      );

      const newExercise = dbExercises.find((e) => e.name === 'new exercise');
      expect(newExercise).toBeDefined();
      expect(newExercise?.attributeValues.length).toBe(0);
    });
  });

  describe('Manager Tests', () => {
    it('should upsert exercises for manager', async () => {
      const exercises = [
        generateExerciseStub({
          name: 'manager exercise',
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: 'eq',
              value: 'barbell',
            }),
          ],
        }),
      ];

      const response = await request(app.getHttpServer())
        .post(`/exercise/many`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ exercises });

      expect(response.status).toBe(201);
      expect(response.body.length).toBe(1);

      const dbExercises = await db.exercises.getAll();
      expect(dbExercises.length).toBe(1);
      expect(dbExercises[0].name).toBe('manager exercise');
      expect(dbExercises[0].ownerId).toBe(institutionId);
      expect(dbExercises[0].id).toBe(
        `manager-exercise-${institutionId.toLowerCase()}`,
      );
    });

    it('should create exercise with the same name as global exercise because institution id is added', async () => {
      await db.exercises.create({
        name: 'squat',
        ownerId: global.GLOBAL_EXERCISE_OWNER,
        componentIds: [component.id],
      });

      const exercises = [
        generateExerciseStub({
          name: 'squat',
          componentIds: [component.id],
          attributeValues: [],
        }),
      ];

      const response = await request(app.getHttpServer())
        .post(`/exercise/many`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ exercises });

      expect(response.status).toBe(201);
      expect(response.body.length).toBe(1);

      const dbExercises = await db.exercises.getAll();
      expect(dbExercises.length).toBe(2); // One global and one manager exercise

      const globalExercise = dbExercises.find(
        (e) => e.ownerId === GLOBAL_EXERCISE_OWNER,
      );

      const managerExercise = dbExercises.find(
        (e) => e.ownerId === institutionId,
      );

      expect(globalExercise?.name).toBe('squat');
      expect(globalExercise?.id).toBe('squat');

      expect(managerExercise?.name).toBe('squat');
      expect(managerExercise?.id).toBe(`squat-${institutionId.toLowerCase()}`);
    });
  });
});
