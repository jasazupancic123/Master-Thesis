import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import type { TestInstitution } from '@src/common/type/entity.type';
import {
  createInstitution,
  createInstitutionWithUsers,
  deleteCollection,
  deleteDoc,
  deleteDocs,
  deleteInstitution,
} from '@src/common/utils/data.util';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';

describe('Get Exercises (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let exerciseService: ExerciseService;
  let componentService: ComponentService;
  let institutionService: InstitutionService;

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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    exerciseService = moduleFixture.get(ExerciseService);
    componentService = moduleFixture.get(ComponentService);
    institutionService = moduleFixture.get(InstitutionService);

    component = await componentService.create(generateComponentStub());
    globalExercises = await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ componentIds: [component.id] }),
      generateExerciseStub({ componentIds: [component.id] }),
      generateExerciseStub({ componentIds: [component.id] }),
    ]);

    institution1 = await createInstitution(institutionService);
    institution2 = await createInstitutionWithUsers(
      firebase,
      institutionService,
    );

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
    await Promise.all([
      deleteCollection(firebase, 'EXERCISE'),
      deleteInstitution(firebase, institution1),
      deleteInstitution(firebase, institution2),
      deleteDoc(firebase, 'COMPONENT', component.id),
      deleteCollection(firebase, 'ATTRIBUTE'),
    ]);

    await app.close();
  });

  describe('Get Exercises', () => {
    it.each([
      ['athlete', global.athlete.token],
      ['trainer', global.trainer.token],
      ['institution', global.manager.token],
      ['admin', global.admin.token],
    ])('should return all global exercises for $s', async (_, token) => {
      const response = await request(app.getHttpServer())
        .get('/exercise/global')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(globalExercises.length);
    });

    it('should return exercises from institution1 for athlete in the institution', async () => {
      const response = await request(app.getHttpServer())
        .get(`/exercise/institution/${institution1.id}`)
        .set('Authorization', `Bearer ${institution1.athletes[0].token}`);

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
      const response = await request(app.getHttpServer())
        .get(`/exercise/institution/${institution1.id}`)
        .set('Authorization', `Bearer ${institution1.trainers[0].token}`);

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
      const response = await request(app.getHttpServer())
        .get(`/exercise/institution/${institution1.id}`)
        .set('Authorization', `Bearer ${institution1.manager.token}`);

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
          request(app.getHttpServer())
            .get(`/exercise/global?componentIds=${f[0]}`)
            .set('Authorization', `Bearer ${institution1.athletes[0].token}`),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(filters[i][1]);
      }

      await Promise.all([
        deleteDocs(firebase, 'COMPONENT', [comp1.id, comp2.id]),
        deleteDocs(firebase, 'EXERCISE', exerciseIds),
      ]);
    });

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
          request(app.getHttpServer())
            .get(
              `/exercise/institution/${institution1.id}?componentIds=${f[0]}`,
            )
            .set('Authorization', `Bearer ${institution1.athletes[0].token}`),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(filters[i][1]);
      }

      await Promise.all([
        deleteDocs(firebase, 'COMPONENT', [comp1.id, comp2.id]),
        deleteDocs(firebase, 'EXERCISE', exerciseIds),
      ]);
    });

    it('should filter exercises by one field', async () => {
      const exercises = [
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:other', 'speed:cod'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:general'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['speed:conditioning'],
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
        ['strength:general', 1],
        ['speed:conditioning', 1],
      ];

      const responses = await Promise.all(
        filters.map((f) =>
          request(app.getHttpServer())
            .get(`/exercise/global?category=${f[0]}`)
            .set('Authorization', `Bearer ${institution1.athletes[0].token}`),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(filters[i][1]);
      }

      await deleteDocs(firebase, 'EXERCISE', exerciseIds);
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
          categories: ['strength:general'],
          equipment: ['cardio:treadmill'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['speed:conditioning'],
          equipment: ['strength:power-rack'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['strength:other'],
          equipment: ['strength:dumbbell'],
        }),
        generateExerciseStub({
          componentIds: [component.id],
          categories: ['speed:cod'],
          equipment: ['strength:dumbbell', 'strength:barbell'],
        }),
      ];

      const exerciseIds = (
        await exerciseService.upsertMany(global.admin, exercises)
      ).map((e) => e.id);

      const filters: [string, string, number][] = [
        // array of <category filter string, equipment filter string, expected returned array length>
        ['strength:other', 'strength:dumbbell', 1],
        ['speed:cod', 'strength:dumbbell', 1],
        ['speed:cod', 'strength:barbell', 1],
        ['strength:general', 'cardio:treadmill', 1],
        ['speed:conditioning', 'strength:power-rack', 1],
        ['strength:other', 'bodyweight:pull-up-bar', 1],
        ['strength:other', 'strength:barbell', 0],
        ['speed:cod', 'cardio:treadmill', 0],
      ];

      const responses = await Promise.all(
        filters.map((f) =>
          request(app.getHttpServer())
            .get(`/exercise/global?category=${f[0]}&equipment=${f[1]}`)
            .set('Authorization', `Bearer ${institution1.athletes[0].token}`),
        ),
      );

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        expect(response.status).toEqual(400);
        expect(response.body.message).toEqual(
          'Only one filter can be applied at a time',
        );
      }

      await deleteDocs(firebase, 'EXERCISE', exerciseIds);
    });
  });
});
