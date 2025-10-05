import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import type { Update } from '@src/common/type/entity.type';
import {
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from '@src/common/utils/auth.util';
import {
  createInstitution,
  deleteDoc,
  deleteInstitution,
  deleteUsers,
} from '@src/common/utils/data.util';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionService } from '@src/institution/service/institution.service';

describe('Update Exercise (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let institutionService: InstitutionService;

  let exercise: Exercise;
  let component: Component;
  let institution: Institution;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    institutionService = moduleFixture.get(InstitutionService);

    institution = await createInstitution(institutionService);
    component = await componentService.create(generateComponentStub());
    exercise = await exerciseService.create(
      global.manager,
      generateExerciseStub({ componentIds: [component.id] }),
    );
  });

  afterAll(async () => {
    await Promise.all([
      deleteInstitution(firebase, institution),
      deleteDoc(firebase, 'EXERCISE', exercise.id),
      deleteDoc(firebase, 'COMPONENT', component.id),
    ]);

    await app.close();
  });

  describe('Update Exercise', () => {
    it('should fail if exercise does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch('/exercise/non-existent-id')
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ name: 'Non-existent Exercise' });

      expect(response.status).toBe(404);
    });

    it('should fail if exercise is institutional and institution does not exist anymore', async () => {
      await deleteDoc(firebase, 'INSTITUTION', institution.id);

      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ name: 'Unauthorized Update' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not allowed to view this exercise',
      );

      await deleteDoc(firebase, 'EXERCISE', exercise.id);
      institution = await createInstitution(institutionService);
      exercise = await exerciseService.create(
        global.manager,
        generateExerciseStub({ componentIds: [component.id] }),
      );
    });

    it('should fail if the user is not in the same institution', async () => {
      const [otherManager, otherTrainer, otherAthlete] = await Promise.all([
        createManagerUserAndToken(firebase),
        createTrainerUserAndToken(firebase),
        createAthleteUserAndToken(firebase),
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

      await deleteUsers(firebase, [otherManager, otherTrainer, otherAthlete]);
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
      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ equipment: ['cardio'] });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual(
        expect.stringContaining(
          'Option "cardio" has nested options, please select one of the following:',
        ),
      );
    });

    it('should allow updating exercise unilateral attribute', async () => {
      const res1 = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ isUnilateral: true });

      expect(res1.status).toBe(200);
      expect(res1.body.isUnilateral).toBe(true);

      const res2 = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ isUnilateral: false });

      expect(res2.status).toBe(200);
      expect(res2.body.isUnilateral).toBe(false);
    });

    it('should update an exercise successfully if user is one of the following: admin, institution owner or trainer', async () => {
      const updateData: Update<Exercise> = {
        name: 'Updated Exercise Name',
        bodyRegions: ['upper', 'core'],
        loadingSides: ['quadruped'],
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
        expect(response.body.bodyRegions).toEqual(updateData.bodyRegions);
        expect(response.body.loadingSides).toEqual(updateData.loadingSides);
      }
    });

    it('should disable an exercise successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ disabled: true });

      expect(response.status).toBe(200);
      expect(response.body.disabled).toBe(true);

      const fetched = await exerciseService.findOneByIdOrFail(global.manager, {
        exerciseId: exercise.id,
      });

      expect(fetched.disabled).toBe(true);
    });
  });

  describe('Delete Exercise', () => {
    afterEach(async () => {
      await deleteDoc(firebase, 'EXERCISE', exercise.id);
      exercise = await exerciseService.create(
        global.manager,
        generateExerciseStub({ componentIds: [component.id] }),
      );
    });

    it('should fail if the user is not the owner', async () => {
      const otherUser = await createTrainerUserAndToken(firebase);
      const response = await request(app.getHttpServer())
        .delete(`/exercise/${exercise.id}`)
        .set('Authorization', `Bearer ${otherUser.token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not allowed to view this exercise',
      );

      await deleteUsers(firebase, [otherUser]);
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
