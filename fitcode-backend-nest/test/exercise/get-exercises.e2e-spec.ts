import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Get Exercises (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let exerciseService: ExerciseService;

  // global
  let component: Component;
  let globalExercises: Exercise[];

  // first institution
  let institution1: TestInstitution;
  let institution1Exercises: Exercise[];

  // second institution
  let institution2: TestInstitution;
  let institution2Exercises: Exercise[];

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    exerciseService = testApp.module.get(ExerciseService);

    component = await db.components.create(generateComponentStub());
    globalExercises = await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ componentIds: [component.id] }),
      generateExerciseStub({ componentIds: [component.id] }),
      generateExerciseStub({ componentIds: [component.id] }),
    ]);

    institution1 = await db.institutions.createTest();
    institution2 = await db.institutions.createTest({
      createRandomAthlete: true,
      createRandomTrainer: true,
      createRandomManager: true,
    });

    [institution1Exercises, institution2Exercises] = await Promise.all([
      exerciseService.upsertMany(institution1.manager, [
        generateExerciseStub({ componentIds: [component.id] }),
      ]),
      exerciseService.upsertMany(institution2.manager, [
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
      ]),
    ]);
  });

  afterAll(async () => {
    await db.institutions.remove(institution2.id); // to remove users as well
    await db.clear();
    await testApp.close();
  });

  describe('Get Exercises', () => {
    it.each([
      ['athlete', global.athlete.token],
      ['trainer', global.trainer.token],
      ['institution', global.manager.token],
      ['admin', global.admin.token],
    ])('should return all global exercises for $s', async (_, token) => {
      const response = await testApp.http.get('/exercise/global', token);
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(globalExercises.length);
    });

    it('should return exercises from institution1 for athlete in the institution', async () => {
      const response = await testApp.http.get(
        `/exercise/institution/${institution1.id}`,
        institution1.athletes[0].token,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(institution1Exercises.length);

      const responseExerciseIds = response.body.map((e: Exercise) => e.id);
      expect(responseExerciseIds).toEqual(
        expect.arrayContaining(institution1Exercises.map((e) => e.id)),
      );

      // ensure trainer2's exercises are not in the response
      for (const exercise of institution2Exercises)
        expect(responseExerciseIds).not.toContain(exercise.id);
    });

    it('should return exercises from institution1 for trainer in the institution', async () => {
      const response = await testApp.http.get(
        `/exercise/institution/${institution1.id}`,
        institution1.trainers[0].token,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(institution1Exercises.length);

      const responseExerciseIds = response.body.map((e: Exercise) => e.id);
      expect(responseExerciseIds).toEqual(
        expect.arrayContaining(institution1Exercises.map((e) => e.id)),
      );

      // ensure trainer2's exercises are not in the response
      for (const exercise of institution2Exercises)
        expect(responseExerciseIds).not.toContain(exercise.id);
    });

    it('should return exercises from institution1 for manager in the institution', async () => {
      const response = await testApp.http.get(
        `/exercise/institution/${institution1.id}`,
        institution1.manager.token,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(institution1Exercises.length);

      const responseExerciseIds = response.body.map((e: Exercise) => e.id);
      expect(responseExerciseIds).toEqual(
        expect.arrayContaining(institution1Exercises.map((e) => e.id)),
      );

      // ensure trainer2's exercises are not in the response
      for (const exercise of institution2Exercises)
        expect(responseExerciseIds).not.toContain(exercise.id);
    });

    it('should return all exercises for admin, even disabled', async () => {
      const disabledExercise = await exerciseService.create(global.admin, {
        ...generateExerciseStub({ componentIds: [component.id] }),
        disabled: true,
      });

      const response = await testApp.http.get(
        '/exercise/global',
        global.admin.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(
        response.body.find((e: Exercise) => e.id === disabledExercise.id),
      ).toBeDefined();

      await db.exercises.delete(disabledExercise.id);
    });

    it.each([
      ['athlete', global.athlete.token],
      ['trainer', global.trainer.token],
      ['manager', global.manager.token],
    ])('should return only enabled exercises for %s', async (_role, token) => {
      const disabledExercise = await exerciseService.create(global.admin, {
        ...generateExerciseStub({ componentIds: [component.id] }),
        disabled: true,
      });

      const response = await testApp.http.get(`/exercise/global`, token);
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(
        response.body.find((e: Exercise) => e.id === disabledExercise.id),
      ).toBeUndefined();

      await db.exercises.delete(disabledExercise.id);
    });
  });

  describe('Filtering Exercises', () => {
    it('should filter exercises by component', async () => {
      const comp1 = await db.components.create(generateComponentStub());
      const comp2 = await db.components.create(generateComponentStub());

      const exercises = [
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp2.id] }),
        generateExerciseStub({ componentIds: [comp2.id] }),
      ];

      const exerciseIds = (
        await exerciseService.upsertMany(global.admin, exercises)
      ).map((e) => e.id);

      const filters: [string, number][] = [
        // array of <filter string, expected returned array length>
        [comp1.id, 3],
        [comp2.id, 2],
        [[comp1.id, comp2.id].join(','), 5],
      ];

      const responses = await Promise.all(
        filters.map((f) =>
          testApp.http.get(
            `/exercise/global?componentIds=${f[0]}`,
            institution1.athletes[0].token,
          ),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(filters[i][1]);
      }

      await db.components.delete(comp1.id);
      await db.components.delete(comp2.id);
      for (const id of exerciseIds) await db.exercises.delete(id);
    });

    it('should filter exercises by component', async () => {
      const comp1 = await db.components.create(generateComponentStub());
      const comp2 = await db.components.create(generateComponentStub());

      const exercises = [
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp1.id] }),
        generateExerciseStub({ componentIds: [comp2.id] }),
        generateExerciseStub({ componentIds: [comp2.id] }),
      ];

      const exerciseIds = (
        await exerciseService.upsertMany(institution1.manager, exercises)
      ).map((e) => e.id);

      const filters: [string, number][] = [
        // array of <filter string, expected returned array length>
        [comp1.id, 3],
        [comp2.id, 2],
        [[comp1.id, comp2.id].join(','), 5],
      ];

      const responses = await Promise.all(
        filters.map((f) =>
          testApp.http.get(
            `/exercise/institution/${institution1.id}?componentIds=${f[0]}`,
            institution1.athletes[0].token,
          ),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(filters[i][1]);
      }

      await db.components.delete(comp1.id);
      await db.components.delete(comp2.id);
      for (const id of exerciseIds) await db.exercises.delete(id);
    });

    it('should filter exercises by one field', async () => {
      const exercises = [
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:other', 'speed:cod'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:general:con-ecc'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['speed:acceleration'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:other'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['speed:cod'],
        }),
      ];

      const exerciseIds = (
        await exerciseService.upsertMany(global.admin, exercises)
      ).map((e) => e.id);

      const filters: [string, number][] = [
        // array of <filter string, expected returned array length>
        ['strength:other', 2],
        ['speed:cod', 2],
        ['strength:general:con-ecc', 1],
        ['speed:acceleration', 1],
      ];

      const responses = await Promise.all(
        filters.map((f) =>
          testApp.http.get(
            `/exercise/global?category=${f[0]}`,
            institution1.athletes[0].token,
          ),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(filters[i][1]);
      }

      await db.exercises.deleteByIds(exerciseIds);
    });

    it('should not filter exercises by multiple fields', async () => {
      const exercises = [
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:other', 'speed:cod'],
          equipment: ['bodyweight:pull-up-bar'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:general:con-ecc'],
          equipment: ['cardio:treadmill'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['speed:acceleration'],
          equipment: ['strength:power-rack'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:other'],
          equipment: ['strength:cable'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['speed:cod'],
          equipment: ['strength:cable', 'strength:barbell'],
        }),
      ];

      const exerciseIds = (
        await exerciseService.upsertMany(global.admin, exercises)
      ).map((e) => e.id);

      const filters: [string, string, number][] = [
        // array of <category filter string, equipment filter string, expected returned array length>
        ['strength:other', 'strength:cable', 1],
        ['speed:cod', 'strength:cable', 1],
        ['speed:cod', 'strength:barbell', 1],
        ['strength:general', 'cardio:treadmill', 1],
        ['speed:acceleration', 'strength:power-rack', 1],
        ['strength:other', 'bodyweight:pull-up-bar', 1],
        ['strength:other', 'strength:barbell', 0],
        ['speed:cod', 'cardio:treadmill', 0],
      ];

      const responses = await Promise.all(
        filters.map((f) =>
          testApp.http.get(
            `/exercise/global?category=${f[0]}&equipment=${f[1]}`,
            institution1.athletes[0].token,
          ),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(400);
        expect(response.body.message).toEqual(
          'Only one filter can be applied at a time',
        );
      }

      await db.exercises.deleteByIds(exerciseIds);
    });
  });
});
