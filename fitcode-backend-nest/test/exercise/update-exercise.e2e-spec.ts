import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { AttributeService } from '../../src/attribute/service/attribute.service';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { Component } from '../../src/component/entity/component.entity';
import { ComponentService } from '../../src/component/component.service';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { Exercise } from '../../src/exercise/entity/exercise.entity';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import {
  createAthleteUserAndToken,
  createInstitutionUserAndToken,
  createTrainerUserAndToken,
} from '../utils/auth.util';
import { generateAttributeStub } from '../../src/attribute/mock/attribute.stub';
import { Attribute } from '../../src/attribute/entity/attribute.entity';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { createInstitution } from '../utils/data.util';
import { Institution } from '../../src/institution/entity/institution.entity';

describe('Update Exercise (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let attributeService: AttributeService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let institutionService: InstitutionService;

  let attribute: Attribute;
  let exercise: Exercise;
  let component: Component;
  let institution: Institution;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    attributeService = moduleFixture.get(AttributeService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    institutionService = moduleFixture.get(InstitutionService);

    institution = await createInstitution(institutionService);
    attribute = await attributeService.create(generateAttributeStub());
    component = await componentService.create(
      generateComponentStub({ attributes: [attribute.field] }),
    );

    exercise = await exerciseService.create(
      global.manager,
      generateExerciseStub({ componentIds: [component.id] }),
    );
  });

  afterAll(async () =>
    Promise.all([
      firebaseService.deleteCollection(FirestoreCollection.EXERCISE),
      firebaseService.deleteCollection(FirestoreCollection.INSTITUTION),
      app.close(),
    ]),
  );

  describe('Update Exercise', () => {
    it('should fail if exercise does not exist', async () => {
      const updateData = { name: 'Non-existent Exercise' };

      const response = await request(app.getHttpServer())
        .patch('/exercise/non-existent-id')
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });

    it('should fail if exercise is institutional and institution does not exist anymore', async () => {
      await firebaseService.firestore
        .collection(FirestoreCollection.INSTITUTION)
        .doc(institution.id)
        .delete();

      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ name: 'Unauthorized Update' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not allowed to view this exercise',
      );

      institution = await createInstitution(institutionService);
      exercise = await exerciseService.create(
        global.manager,
        generateExerciseStub({ componentIds: [component.id] }),
      );
    });

    it('should fail if the user is not in the same institution', async () => {
      const [otherManager, otherTrainer, otherAthlete] = await Promise.all([
        createInstitutionUserAndToken(firebaseService),
        createTrainerUserAndToken(firebaseService),
        createAthleteUserAndToken(firebaseService),
      ]);

      async function updateExercise(token: string) {
        return await request(app.getHttpServer())
          .patch(`/exercise/${exercise.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'test' });
      }

      const responses = await Promise.all([
        updateExercise(otherManager.token),
        updateExercise(otherTrainer.token),
        updateExercise(otherAthlete.token),
      ]);

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
          'You are not allowed to view this exercise',
        );
      }
    });

    it('should fail if the user is in the same institution but without permissions', async () => {
      async function updateExercise(token: string) {
        return await request(app.getHttpServer())
          .patch(`/exercise/${exercise.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'test' });
      }

      const responses = await Promise.all([
        updateExercise(global.athlete.token),
      ]);

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
          'You are not allowed to edit this exercise',
        );
      }
    });

    it('should not allow updating componentId', async () => {
      const updateData = { componentIds: ['new-component-id'] };

      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot update the main component of an exercise',
      );
    });

    it('should validate attribute values before updating', async () => {
      const invalidAttributes = [{ field: 'invalid', value: 'wrong' }];

      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ attributeValues: invalidAttributes });

      expect(response.status).toBe(200);
      expect(response.body.attributeValues).toEqual([]);
    });

    it('should update an exercise successfully if user is one of the following: admin, institution owner or trainer', async () => {
      const updateData = {
        name: 'Updated Exercise Name',
        attributeValues: [{ field: attribute.field, value: 'test' }],
      };

      async function updateExercise(token: string) {
        return await request(app.getHttpServer())
          .patch(`/exercise/${exercise.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updateData);
      }

      const responses = await Promise.all([
        updateExercise(global.manager.token),
        updateExercise(global.trainer.token),
      ]);

      for (const response of responses) {
        expect(response.status).toBe(200);
        expect(response.body.name).toBe(updateData.name);
        expect(response.body.attributeValues).toEqual([
          {
            field: attribute.field,
            value: 'test',
            exerciseId: exercise.id,
            ownerId: institution.id,
          },
        ]);
      }
    });
  });

  describe('Delete Exercise', () => {
    afterEach(async () => {
      exercise = await exerciseService.create(
        global.manager,
        generateExerciseStub({ componentIds: [component.id] }),
      );
    });

    it('should fail if the user is not the owner', async () => {
      const otherUser = await createTrainerUserAndToken(firebaseService);
      const response = await request(app.getHttpServer())
        .delete(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${otherUser.token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not allowed to view this exercise',
      );
    });

    it('should fail if exercise does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/exercise/non-existent-id')
        .set('Authorization', `Bearer ${global.manager.token}`);

      expect(response.status).toBe(404);
    });

    it('should delete an exercise successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`);

      expect(response.status).toBe(200);
    });
  });
});
