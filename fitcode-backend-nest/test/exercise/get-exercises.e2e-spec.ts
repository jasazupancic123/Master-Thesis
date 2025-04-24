import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { Exercise } from '../../src/exercise/entity/exercise.entity';
import { TestUser } from '../type/auth.type';
import { createTrainerUserAndToken } from '../utils/auth.util';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { UserService } from '../../src/user/user.service';
import { Component } from '../../src/component/entity/component.entity';
import { ComponentService } from '../../src/component/component.service';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { generateExerciseAttributeValueStub } from '../../src/attribute/mock/attribute-value.stub';
import { AttributeService } from '../../src/attribute/service/attribute.service';
import {
  generateAttributeStub,
  generateMultiselectAttribute,
} from '../../src/attribute/mock/attribute.stub';
import { AttributeType } from '../../src/common/enum/attribute-type.enum';

describe('Get Exercises (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let exerciseService: ExerciseService;
  let componentService: ComponentService;
  let attributeService: AttributeService;
  let userService: UserService;

  let component: Component;
  let globalExercises: Exercise[];
  let trainer1: TestUser;
  let trainer1Exercises: Exercise[];
  let trainer2: TestUser;
  let trainer2Exercises: Exercise[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    exerciseService = moduleFixture.get(ExerciseService);
    componentService = moduleFixture.get(ComponentService);
    attributeService = moduleFixture.get(AttributeService);
    userService = moduleFixture.get(UserService);

    component = await componentService.create(generateComponentStub());
    globalExercises = await exerciseService.createMany(global.admin, [
      generateExerciseStub({ componentIds: [component.id] }),
      generateExerciseStub({ componentIds: [component.id] }),
      generateExerciseStub({ componentIds: [component.id] }),
    ]);

    trainer1 = await createTrainerUserAndToken(firebaseService);
    trainer1Exercises = await exerciseService.createMany(trainer1, [
      generateExerciseStub({ componentIds: [component.id] }),
    ]);

    trainer2 = await createTrainerUserAndToken(firebaseService);
    trainer2Exercises = await exerciseService.createMany(trainer2, [
      generateExerciseStub({ componentIds: [component.id] }),
      generateExerciseStub({ componentIds: [component.id] }),
    ]);
  });

  afterAll(async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await app.close();
  });

  describe('Get Exercises', () => {
    it('should return all global exercises for a user without trainers', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercise')
        .set('Authorization', `Bearer ${athlete.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(globalExercises.length);
    });

    it("should return global exercises and only trainer1's exercises for trainer1", async () => {
      const response = await request(app.getHttpServer())
        .get('/exercise')
        .set('Authorization', `Bearer ${trainer1.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(
        globalExercises.length + trainer1Exercises.length,
      );

      const responseExerciseIds = response.body.map((e: Exercise) => e.id);
      expect(responseExerciseIds).toEqual(
        expect.arrayContaining([
          ...globalExercises.map((e) => e.id),
          ...trainer1Exercises.map((e) => e.id),
        ]),
      );

      // ensure trainer2's exercises are not in the response
      for (const exercise of trainer2Exercises)
        expect(responseExerciseIds).not.toContain(exercise.id);
    });

    it("should return global exercises and only trainer2's exercises for trainer2", async () => {
      const response = await request(app.getHttpServer())
        .get('/exercise')
        .set('Authorization', `Bearer ${trainer2.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(
        globalExercises.length + trainer2Exercises.length,
      );

      const responseExerciseIds = response.body.map((e: Exercise) => e.id);
      expect(responseExerciseIds).toEqual(
        expect.arrayContaining([
          ...globalExercises.map((e) => e.id),
          ...trainer2Exercises.map((e) => e.id),
        ]),
      );

      // ensure trainer1's exercises are not in the response
      for (const exercise of trainer1Exercises)
        expect(responseExerciseIds).not.toContain(exercise.id);
    });

    it('should return all exercises for athlete with both trainers', async () => {
      await userService.addTrainer({ uid: athlete.uid }, trainer1.uid);
      await userService.addTrainer({ uid: athlete.uid }, trainer2.uid);

      const response = await request(app.getHttpServer())
        .get('/exercise')
        .set('Authorization', `Bearer ${athlete.token}`);

      expect(response.status).toBe(200);

      // athlete should see global exercises + trainer1's exercises + trainer2's exercises
      const expectedExercises = [
        ...globalExercises,
        ...trainer1Exercises,
        ...trainer2Exercises,
      ];

      expect(response.body).toHaveLength(expectedExercises.length);

      const responseExerciseIds = response.body.map((e: Exercise) => e.id);
      expect(responseExerciseIds).toEqual(
        expect.arrayContaining(expectedExercises.map((e) => e.id)),
      );

      await userService.removeTrainer({ uid: athlete.uid }, trainer1.uid);
      await userService.removeTrainer({ uid: athlete.uid }, trainer2.uid);
    });

    it('should return an exercise by ID for the owner or authorized trainer', async () => {
      const exercise = trainer1Exercises[0]; // choose an exercise from trainer1
      const response = await request(app.getHttpServer())
        .get(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${trainer1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(exercise.id);
    });

    it('should return an exercise by ID for any user if its global exercise', async () => {
      const tokens = [trainer1.token, trainer2.token, athlete.token];
      const exercise = globalExercises[0]; // choose the first global exercise

      await Promise.all(
        tokens.map(async (token) => {
          const response = await request(app.getHttpServer())
            .get(`/exercise/${exercise.id}`)
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(200);
          expect(response.body.id).toBe(exercise.id);
        }),
      );
    });

    it('should return 403 if a trainer tries to fetch another trainer’s exercise by ID', async () => {
      const exercise = trainer2Exercises[0]; // choose an exercise from trainer2
      const response = await request(app.getHttpServer())
        .get(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${trainer1.token}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 if the exercise does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/exercise/non-existent-id`)
        .set('Authorization', `Bearer ${trainer1.token}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 if an athlete tries to fetch an exercise from an unlinked trainer by ID', async () => {
      const exercise = trainer2Exercises[0]; // choose an exercise from trainer2
      const response = await request(app.getHttpServer())
        .get(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${athlete.token}`);

      expect(response.status).toBe(403);
    });

    it('should return an exercise by ID for athlete with both trainers', async () => {
      // Add both trainers to the athlete's list of trainers
      await userService.addTrainer({ uid: athlete.uid }, trainer1.uid);

      const exercise = trainer1Exercises[0]; // choose an exercise from trainer1
      const response = await request(app.getHttpServer())
        .get(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${athlete.token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(exercise.id);

      await userService.removeTrainer({ uid: athlete.uid }, trainer1.uid);
    });
  });

  describe('Filtering Exercises', () => {
    it('should filter exercises by component', async () => {
      const comp1 = await componentService.create(generateComponentStub());
      const comp2 = await componentService.create(generateComponentStub());

      const exercises = [
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp2.id] }),
        generateExerciseStub({ componentIds: [comp2.id] }),
      ];

      await exerciseService.createMany(trainer, exercises);

      const filters: [string, number][] = [
        // array of <filter string, expected returned array length>
        [comp1.id, 3],
        [comp2.id, 2],
        [[comp1.id, comp2.id].join(','), 5],
      ];

      const responses = await Promise.all(
        filters.map((f) =>
          request(app.getHttpServer())
            .get(`/exercise?componentIds=${f[0]}`)
            .set('Authorization', `Bearer ${trainer.token}`),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(filters[i][1]);
      }
    });

    it('should filter exercises by multiselect attribute', async () => {
      await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);

      const attribute = await attributeService.create(
        generateMultiselectAttribute(),
      );

      const component = await componentService.create(
        generateComponentStub({ attributes: [attribute.field] }),
      );

      const exercises = [
        generateExerciseStub({
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:a',
              value: 'a',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:b',
              value: 'b',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:c',
              value: 'my custom string',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'second:a',
              value: '123',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'second:b',
              value: 'true',
            }),
          ],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:a',
              value: 'a',
            }),
          ],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'second:a',
              value: '125',
            }),
          ],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'second:b',
              value: 'true',
            }),
          ],
        }),
      ];

      await exerciseService.createMany(trainer, exercises);
      const attributeValues = (await exerciseService.findAll(trainer)).flatMap(
        (e) => e.attributeValues,
      );

      expect(attributeValues).toHaveLength(8);

      const filters: [string, number][] = [
        // array of <filter string, expected returned array length>
        [`field=${attribute.field}&selected=first:a`, 2],
        [`field=${attribute.field}&selected=first:b`, 1],
        [`field=${attribute.field}&selected=second:a`, 2],
        [`field=${attribute.field}&selected=second:a&value=125`, 1],
        [`field=${attribute.field}&selected=second:b&value=true`, 2],
        [`field=${attribute.field}&selected=second:b&value=false`, 0],
      ];

      for (const [filter, expectedLength] of filters) {
        const response = await request(app.getHttpServer())
          .get(`/exercise?${filter}`)
          .set('Authorization', `Bearer ${trainer.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(expectedLength);
      }
    });

    it('should filter by combined properties', async () => {
      await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);

      const attribute = await attributeService.create(
        generateMultiselectAttribute(),
      );

      const boolAttr = await attributeService.create(
        generateAttributeStub({ type: AttributeType.Boolean }),
      );

      const stringAttr = await attributeService.create(
        generateAttributeStub({ type: AttributeType.String }),
      );

      const comp1 = await componentService.create(
        generateComponentStub({
          attributes: [attribute.field, boolAttr.field],
        }),
      );

      const comp2 = await componentService.create(
        generateComponentStub({
          attributes: [attribute.field, stringAttr.field],
        }),
      );

      const exercises = [
        generateExerciseStub({
          componentIds: [comp1.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: boolAttr.field,
              value: 'true',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:a',
              value: 'a',
            }),
          ],
        }),
        generateExerciseStub({
          componentIds: [comp1.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: boolAttr.field,
              value: 'false',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:a',
              value: 'a',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:b',
              value: 'b',
            }),
          ],
        }),
        generateExerciseStub({
          componentIds: [comp2.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: stringAttr.field,
              value: 'test 2',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:a',
              value: 'a',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:c',
              value: 'test',
            }),
          ],
        }),
        generateExerciseStub({
          componentIds: [comp2.id],
          attributeValues: [
            generateExerciseAttributeValueStub({
              field: stringAttr.field,
              value: 'test 2',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:b',
              value: 'b',
            }),
            generateExerciseAttributeValueStub({
              field: attribute.field,
              selected: 'first:c',
              value: 'test 2',
            }),
          ],
        }),
      ];

      await exerciseService.createMany(admin, exercises);

      const attributeValues = (await exerciseService.findAll(trainer)).flatMap(
        (e) => e.attributeValues,
      );

      expect(attributeValues).toHaveLength(11);

      const filters: [string, number][] = [
        // array of <filter string, expected returned array length>
        [`value=test 2`, 2],
        [`field=${boolAttr.field}&value=true`, 1],
        [`field=${boolAttr.field}&value=false`, 1],
        [`field=${attribute.field}&selected=first:a`, 3],
        [
          `componentIds=${comp1.id}&field=${attribute.field}&selected=first:a`,
          2,
        ],
        [
          `componentIds=${comp2.id}&field=${attribute.field}&selected=first:a`,
          1,
        ],
        [
          `componentIds=${comp1.id},${comp2.id}&field=${attribute.field}&selected=first:a`,
          3,
        ],
      ];

      for (const [filter, expectedLength] of filters) {
        const response = await request(app.getHttpServer())
          .get(`/exercise?${filter}`)
          .set('Authorization', `Bearer ${trainer.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(expectedLength);
      }
    });
  });
});
