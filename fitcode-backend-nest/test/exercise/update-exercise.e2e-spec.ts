import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { AttributeService } from '../../src/attribute/service/attribute.service';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { Component } from '../../src/component/entity/component.entity';
import { ComponentService } from '../../src/component/component.service';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { CacheManagerService } from '../../src/cache-manager/cache-manager.service';
import { Exercise } from '../../src/exercise/entity/exercise.entity';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { createTrainerUserAndToken } from '../utils/auth.util';
import { generateAttributeStub } from '../../src/attribute/mock/attribute.stub';
import { Attribute } from '../../src/attribute/entity/attribute.entity';

describe('Update Exercise (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let attributeService: AttributeService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;

  let attribute: Attribute;
  let exercise: Exercise;
  let component: Component;

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

    attribute = await attributeService.create(generateAttributeStub());
    component = await componentService.create(
      generateComponentStub({ attributes: [attribute.field] }),
    );

    exercise = await exerciseService.create(
      trainer,
      generateExerciseStub({ componentIds: [component.id] }),
    );
  });

  afterAll(async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await app.close();
  });

  describe('Update Exercise', () => {
    it('should update an exercise successfully', async () => {
      const updateData = {
        name: 'Updated Exercise Name',
        attributeValues: [{ field: attribute.field, value: 'test' }],
      };

      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.attributeValues).toEqual([
        {
          field: attribute.field,
          value: 'test',
          exerciseId: exercise.id,
          ownerId: trainer.uid,
        },
      ]);
    });

    it('should not allow updating componentId', async () => {
      const updateData = { componentIds: ['new-component-id'] };

      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot update the main component of an exercise',
      );
    });

    it('should fail if the user is not the owner', async () => {
      const otherUser = await createTrainerUserAndToken(firebaseService);
      const updateData = { name: 'Unauthorized Update' };

      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });

    it('should fail if exercise does not exist', async () => {
      const updateData = { name: 'Non-existent Exercise' };

      const response = await request(app.getHttpServer())
        .patch('/exercise/non-existent-id')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });

    it('should validate attribute values before updating', async () => {
      const invalidAttributes = [{ field: 'invalid', value: 'wrong' }];

      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send({ attributeValues: invalidAttributes });

      expect(response.status).toBe(200);
      expect(response.body.attributeValues).toEqual([]);
    });
  });

  describe('Delete Exercise', () => {
    afterEach(async () => {
      exercise = await exerciseService.create(
        trainer,
        generateExerciseStub({ componentIds: [component.id] }),
      );
    });

    it('should delete an exercise successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${trainer.token}`);

      expect(response.status).toBe(200);
    });

    it('should fail if the user is not the owner', async () => {
      const otherUser = await createTrainerUserAndToken(firebaseService);
      const response = await request(app.getHttpServer())
        .delete(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${otherUser.token}`);

      expect(response.status).toBe(403);
    });

    it('should fail if exercise does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/exercise/non-existent-id')
        .set('Authorization', `Bearer ${trainer.token}`);

      expect(response.status).toBe(404);
    });
  });
});
