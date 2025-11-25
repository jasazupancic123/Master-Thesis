import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { TestDbService } from '@src/test-db/test-db.service';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({ field: 'c1' });
  const c2 = generateComponentStub({ field: 'c2' });
  const warmup = generateComponentStub({ field: 'warmup' });
  const cooldown = generateComponentStub({ field: 'cooldown' });

  return {
    WARMUP_ID: 'warmup',
    COOLDOWN_ID: 'cooldown',
    WARMUP: warmup,
    COOLDOWN: cooldown,
    Components: [warmup, c1, c2, cooldown],
  };
});

describe('Get Exercises (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let exerciseService: ExerciseService;

  // global
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

    globalExercises = await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ components: ['c1'] }),
      generateExerciseStub({ components: ['c1'] }),
      generateExerciseStub({ components: ['c1'] }),
    ]);

    institution1 = await db.institutions.createTest();
    institution2 = await db.institutions.createTest({
      createRandomAthlete: true,
      createRandomTrainer: true,
      createRandomManager: true,
    });

    [institution1Exercises, institution2Exercises] = await Promise.all([
      exerciseService.upsertMany(institution1.manager, [
        generateExerciseStub({ components: ['c1'] }),
      ]),
      exerciseService.upsertMany(institution2.manager, [
        generateExerciseStub({ components: ['c1'] }),
        generateExerciseStub({ components: ['c1'] }),
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

    it('should return exercises from institution1 and all global for athlete in the institution', async () => {
      const response = await testApp.http.get(
        `/exercise/institution/${institution1.id}`,
        institution1.athletes[0].token,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(4); // 3 global + 1 institution1

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
      expect(response.body).toHaveLength(4); // 3 global + 1 institution1

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
      expect(response.body).toHaveLength(4); // 3 global + 1 institution1

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
        ...generateExerciseStub({ components: ['c1'] }),
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
        ...generateExerciseStub({ components: ['c1'] }),
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
    // delete all exercises
    beforeEach(async () => await db.exercises.clear());

    it('should filter exercises by component', async () => {
      const exercises = [
        generateExerciseStub({ components: ['c1'] }),
        generateExerciseStub({ components: ['c1'] }),
        generateExerciseStub({ components: ['c1'] }),
        generateExerciseStub({ components: ['c2'] }),
        generateExerciseStub({ components: ['c2'] }),
      ];

      const exerciseIds = (
        await exerciseService.upsertMany(global.admin, exercises)
      ).map((e) => e.id);

      const filters: [string, number][] = [
        // array of <filter string, expected returned array length>
        ['c1', 3],
        ['c2', 2],
        [['c1', 'c2'].join(','), 5],
      ];

      const responses = await Promise.all(
        filters.map((f) =>
          testApp.http.get(
            `/exercise/global?component=${f[0]}`,
            institution1.athletes[0].token,
          ),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(filters[i][1]);
      }

      for (const id of exerciseIds) await db.exercises.delete(id);
    });
  });
});
