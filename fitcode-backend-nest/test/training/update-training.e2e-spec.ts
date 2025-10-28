import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import type { UpdateTraining } from '@src/training/interface/update-training.interface';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';

describe('Update Training (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let trainingService: TrainingService;

  let component1: Component;
  let component2: Component;

  // first institution
  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  // other institution
  let otherInstitution: TestInstitution;
  let otherGroup: Group;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    trainingService = testApp.module.get(TrainingService);

    component1 = await db.components.create(
      generateComponentStub({ params: ['reps', 'loadKg'] }),
    );

    component2 = await db.components.create(
      generateComponentStub({ params: ['dist', 'tempo', 'eff'] }),
    );

    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);
    training = await createTraining();

    otherInstitution = await db.institutions.createTest({
      createRandomAthlete: true,
      createRandomTrainer: true,
      createRandomManager: true,
    });

    otherGroup = await db.groups.createTest(otherInstitution);
  });

  afterAll(async () => {
    await db.institutions.remove(institution.id);
    await db.institutions.remove(otherInstitution.id);
    await db.clear();
    await testApp.close();
  });

  async function createTraining(data?: Partial<Training>) {
    const trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [generateTrainingComponent({ id: component1.id })],
        ...data,
      }),
    );

    return db.trainings.findById(trainingId);
  }

  async function req(
    body: Partial<UpdateTraining>,
    _trainingId = training.id,
    token: string = global.trainer.token,
  ) {
    return await testApp.http.patch(`/training/${_trainingId}`, token, body);
  }

  describe('Update training', () => {
    it('should fail to update training if training id not found', async () => {
      const response = await req(training, 'invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Training not found`);
    });

    it('should fail to update training if users from same institution without permission try to edit it', async () => {
      const responses = await Promise.all(
        [global.athlete].map((user) => req(training, undefined, user.token)),
      );

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(`You cannot edit this training`);
      }
    });

    it('should fail to update training if users from other institution try to edit it', async () => {
      const responses = await Promise.all(
        [
          otherInstitution.athletes[0],
          otherInstitution.trainers[0],
          otherInstitution.manager,
        ].map((user) => req(training, undefined, user.token)),
      );

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(`You cannot view this training`);
      }
    });

    it('should delete training if there are not any components left', async () => {
      const response = await req({ ...training, components: [] });
      const trainings = await trainingService.findAll(global.trainer);
      expect(response.status).toBe(200);
      expect(trainings).toHaveLength(0);

      await db.trainings.delete(training.id);
      training = await createTraining();
    });

    it('should fail if input has unilateral exercise with only one side set', async () => {
      const exercise = await db.exercises.createTest({
        name: 'Bilateral Exercise',
        ownerId: global.trainer.uid,
        componentIds: [component1.id],
        isUnilateral: true,
      });

      const sets = [
        generateExerciseSet(1, {
          reps: 10,
          repsR: undefined,
          loadKg: 50,
          loadKgR: 50,
        }),
      ];

      const response = await req({
        ...training,
        components: [
          generateTrainingComponent({
            id: component1.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercise.id, sets }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Both primary and secondary side must be defined for param reps in unilateral exercises`,
      );

      await db.exercises.delete(exercise.id);
    });
  });
});
