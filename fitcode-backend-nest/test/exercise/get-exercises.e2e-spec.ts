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
import { generateExerciseStub } from '../mock/exercise.stub';
import { UserService } from '../../src/user/user.service';
import { Component } from '../../src/component/entity/component.entity';
import { ComponentService } from '../../src/component/component.service';
import { generateComponentStub } from '../mock/component.stub';
import { BodyRegion } from '../../src/exercise/enum/body-region';
import { CacheManagerService } from '../../src/cache-manager/cache-manager.service';

describe('Get Exercises (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let exerciseService: ExerciseService;
  let componentService: ComponentService;
  let cacheManagerService: CacheManagerService;
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
    cacheManagerService = moduleFixture.get(CacheManagerService);
    userService = moduleFixture.get(UserService);

    component = await componentService.create(generateComponentStub());
    globalExercises = await exerciseService.createMany(global.admin, [
      generateExerciseStub({ componentId: component.id }),
      generateExerciseStub({ componentId: component.id }),
      generateExerciseStub({ componentId: component.id }),
    ]);

    trainer1 = await createTrainerUserAndToken(firebaseService);
    trainer1Exercises = await exerciseService.createMany(trainer1, [
      generateExerciseStub({ componentId: component.id }),
    ]);

    trainer2 = await createTrainerUserAndToken(firebaseService);
    trainer2Exercises = await exerciseService.createMany(trainer2, [
      generateExerciseStub({ componentId: component.id }),
      generateExerciseStub({ componentId: component.id }),
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
    it('should filter exercises by coordination', async () => {
      const exercises = [
        generateExerciseStub({ componentId: component.id, coordination: true }),
        generateExerciseStub({ componentId: component.id, coordination: true }),
        generateExerciseStub({ componentId: component.id, coordination: true }),
        generateExerciseStub({ componentId: component.id }),
        generateExerciseStub({ componentId: component.id }),
      ];

      await exerciseService.createMany(trainer, exercises);

      const response = await request(app.getHttpServer())
        .get('/exercise?coordination=true')
        .set('Authorization', `Bearer ${trainer.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
    });

    it('should filter exercises by componentId', async () => {
      const otherComponent = await componentService.create(
        generateComponentStub(),
      );

      await cacheManagerService.clearComponents();
      const exercises = [
        generateExerciseStub({ componentId: otherComponent.id }),
        generateExerciseStub({ componentId: otherComponent.id }),
        generateExerciseStub({ componentId: otherComponent.id }),
        generateExerciseStub({ componentId: component.id }),
        generateExerciseStub({ componentId: component.id }),
      ];

      await exerciseService.createMany(trainer, exercises);

      const response = await request(app.getHttpServer())
        .get(`/exercise?componentId=${otherComponent.id}`)
        .set('Authorization', `Bearer ${trainer.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      response.body.forEach((exercise: Exercise) => {
        expect(exercise.componentId).toBe(otherComponent.id);
      });
    });

    it('should filter exercises by region', async () => {
      const exercises = [
        generateExerciseStub({
          componentId: component.id,
          region: BodyRegion.UpperBody,
        }),
        generateExerciseStub({
          componentId: component.id,
          region: BodyRegion.UpperBody,
        }),
        generateExerciseStub({
          componentId: component.id,
          region: BodyRegion.UpperBody,
        }),
        generateExerciseStub({ componentId: component.id }),
        generateExerciseStub({ componentId: component.id }),
      ];

      await exerciseService.createMany(trainer, exercises);

      const response = await request(app.getHttpServer())
        .get(`/exercise?region=${BodyRegion.UpperBody}`)
        .set('Authorization', `Bearer ${trainer.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      response.body.forEach((exercise: Exercise) => {
        expect(exercise.region).toBe(BodyRegion.UpperBody);
      });
    });

    it('should filter by combined properties', async () => {});
  });
});
