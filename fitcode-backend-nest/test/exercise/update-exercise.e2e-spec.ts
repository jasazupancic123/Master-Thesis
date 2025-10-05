import { TestApp } from '@test/common/utils/app.util';
import type * as request from 'supertest';

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
  let testApp: TestApp;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let institutionService: InstitutionService;

  let exercise: Exercise;
  let component: Component;
  let institution: Institution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    firebase = testApp.module.get(FirebaseService);
    componentService = testApp.module.get(ComponentService);
    exerciseService = testApp.module.get(ExerciseService);
    institutionService = testApp.module.get(InstitutionService);

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

    await testApp.close();
  });

  async function req(
    id: string,
    exerciseData: Partial<Exercise>,
    token: string,
  ): Promise<request.Response> {
    return await testApp.http.patch(`/exercise/${id}`, token, exerciseData);
  }

  describe('Update Exercise', () => {
    it('should fail if exercise does not exist', async () => {
      const response = await req(
        'non-existent-id',
        { name: 'Non-existent Exercise' },
        global.manager.token,
      );

      expect(response.status).toBe(404);
    });

    it('should fail if exercise is institutional and institution does not exist anymore', async () => {
      await deleteDoc(firebase, 'INSTITUTION', institution.id);

      const response = await req(
        exercise.id,
        { name: 'Unauthorized Update' },
        global.manager.token,
      );

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
        return await req(exercise.id, { name: 'test' }, token);
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
        return await req(exercise.id, { name: 'test' }, token);
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
      const response = await req(exercise.id, updateData, global.manager.token);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot update the main component of an exercise',
      );
    });

    it('should validate attribute values before updating', async () => {
      const response = await req(
        exercise.id,
        { equipment: ['cardio'] },
        global.manager.token,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual(
        expect.stringContaining(
          'Option "cardio" has nested options, please select one of the following:',
        ),
      );
    });

    it('should allow updating exercise unilateral attribute', async () => {
      const res1 = await req(
        exercise.id,
        { isUnilateral: true },
        global.manager.token,
      );

      expect(res1.status).toBe(200);
      expect(res1.body.isUnilateral).toBe(true);

      const res2 = await req(
        exercise.id,
        { isUnilateral: false },
        global.manager.token,
      );

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
        return await req(exercise.id, updateData, token);
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
      const response = await req(
        exercise.id,
        { disabled: true },
        global.manager.token,
      );

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
      const response = await testApp.http.delete(
        `/exercise/${exercise.id}`,
        otherUser.token,
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not allowed to view this exercise',
      );

      await deleteUsers(firebase, [otherUser]);
    });

    it('should fail if exercise does not exist', async () => {
      const response = await testApp.http.delete(
        '/exercise/non-existent-id',
        global.manager.token,
      );

      expect(response.status).toBe(404);
    });

    it('should delete an exercise successfully', async () => {
      const response = await testApp.http.delete(
        `/exercise/${exercise.id}`,
        global.manager.token,
      );

      expect(response.status).toBe(200);
    });
  });
});
