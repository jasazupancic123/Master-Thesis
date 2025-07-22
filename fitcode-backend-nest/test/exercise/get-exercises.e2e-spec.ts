import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  createInstitution,
  createInstitutionWithUsers,
  deleteCollection,
  deleteDoc,
  deleteDocs,
  deleteInstitution,
} from '@test/common/utils/data.util';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import {
  generateAttributeStub,
  generateMultiselectAttribute,
} from '@src/attribute/mock/attribute.stub';
import { generateExerciseAttributeValueStub } from '@src/attribute/mock/attribute-value.stub';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { AttributeType } from '@src/common/enum/attribute-type.enum';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';

import type { TestInstitution } from '../common/type/entity.type';

describe('Get Exercises (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let exerciseService: ExerciseService;
  let componentService: ComponentService;
  let attributeService: AttributeService;
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
    attributeService = moduleFixture.get(AttributeService);
    institutionService = moduleFixture.get(InstitutionService);

    component = await componentService.create(generateComponentStub());
    globalExercises = await exerciseService.createMany(global.admin, [
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
      exerciseService.createMany(institution1.manager, [
        generateExerciseStub({ componentIds: [component.id] }),
      ]),
      exerciseService.createMany(institution2.manager, [
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
        await exerciseService.createMany(global.admin, exercises)
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
        await exerciseService.createMany(institution1.manager, exercises)
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

    it('should filter exercises by multiselect attribute', async () => {
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

      const exerciseIds = (
        await exerciseService.createMany(global.admin, exercises)
      ).map((e) => e.id);

      const attributeValues = (await exerciseService.findAllGlobal()).flatMap(
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
          .get(`/exercise/global?${filter}`)
          .set('Authorization', `Bearer ${institution1.athletes[0].token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(expectedLength);
      }

      await Promise.all([
        deleteDoc(firebase, 'ATTRIBUTE', attribute.field),
        deleteDoc(firebase, 'COMPONENT', component.id),
        deleteDocs(firebase, 'EXERCISE', exerciseIds),
      ]);
    });

    it('should filter by combined properties', async () => {
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

      const exerciseIds = (
        await exerciseService.createMany(global.admin, exercises)
      ).map((e) => e.id);

      const attributeValues = (await exerciseService.findAllGlobal()).flatMap(
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
          .get(`/exercise/global?${filter}`)
          .set('Authorization', `Bearer ${institution1.manager.token}`);

        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(expectedLength);
      }

      await Promise.all([
        deleteDocs(firebase, 'COMPONENT', [comp1.id, comp2.id]),
        deleteDocs(firebase, 'EXERCISE', exerciseIds),
      ]);
    });
  });
});
