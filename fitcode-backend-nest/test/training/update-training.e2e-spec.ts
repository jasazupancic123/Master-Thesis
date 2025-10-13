import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import {
  createGroupWithCycles,
  createInstitution,
  createInstitutionWithUsers,
  deleteDoc,
  deleteDocs,
  deleteInstitution,
} from '@src/common/utils/data.util';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
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

  let firebase: FirebaseService;
  let componentService: ComponentService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let institutionService: InstitutionService;

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
    firebase = testApp.module.get(FirebaseService);
    componentService = testApp.module.get(ComponentService);
    trainingService = testApp.module.get(TrainingService);
    groupService = testApp.module.get(GroupService);
    institutionService = testApp.module.get(InstitutionService);

    component1 = await componentService.create(
      generateComponentStub({ params: ['reps', 'loadKg'] }),
    );

    component2 = await componentService.create(
      generateComponentStub({ params: ['dist', 'tempo', 'eff'] }),
    );

    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, institution);
    training = await createTraining();

    otherInstitution = await createInstitutionWithUsers(
      firebase,
      institutionService,
    );

    otherGroup = await createGroupWithCycles(groupService, otherInstitution);
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'TRAINING', training.id),
      deleteDocs(firebase, 'GROUP', [otherGroup.id, group.id]),
      deleteInstitution(firebase, institution),
      deleteInstitution(firebase, otherInstitution),
      deleteDoc(firebase, 'COMPONENT', component1.id),
      deleteDoc(firebase, 'COMPONENT', component2.id),
    ]);

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

      await deleteDoc(firebase, 'TRAINING', training.id);
      training = await createTraining();
    });

    it('should fail if input has unilateral exercise with only one side set', async () => {
      const exercise = await db.exercises.create({
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
