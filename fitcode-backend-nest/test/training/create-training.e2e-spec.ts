import { TestApp } from '@test/common/utils/app.util';
import { expectDatesToMatchUpToMinute } from '@test/common/utils/date.util';
import { addDays, addHours, subDays, subMinutes } from 'date-fns';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import type { TestInstitution } from '@src/common/type/entity.type';
import { getTime } from '@src/common/utils/date.util';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import { MAX_NUM_COMPONENTS_IN_TRAINING } from '@src/training/constant/training-limits.constant';
import type { CreateTrainingDto } from '@src/training/dto/create-training.dto';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({
    field: 'c1',
    params: ['reps'],
    options: [generateComponentStub({ field: 'leaf1' })],
  });
  const c2 = generateComponentStub({ field: 'c2' });
  const c3 = generateComponentStub({ field: 'c3' });
  const other = generateComponentStub({ field: 'other' });

  return { Components: [other, c1, c2, c3] };
});

describe('Create Training (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let firebase: FirebaseService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;

  let institution: TestInstitution;
  let group: Group;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    firebase = testApp.module.get(FirebaseService);
    exerciseService = testApp.module.get(ExerciseService);
    trainingService = testApp.module.get(TrainingService);

    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);
  });

  afterAll(async () => {
    await db.institutions.remove(institution.id);
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, input: Partial<CreateTrainingDto>) {
    return await testApp.http.post('/training', token, input);
  }

  describe('Create training', () => {
    it('should fail to create new training if group provided and not found', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: 'invalid-group-id',
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Group does not exist`);
    });

    it('should fail to create new training if group and cycle provided and cycle not found', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: 'invalid-cycle-id',
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Cycle does not exist`);
    });

    it('should fail to create new training if cycle not found', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: 'invalid-cycle-id',
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Cycle does not exist`);
    });

    it('should fail to create new training if training does not have atleast one component', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: group.cycles[0].id,
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training must have at least one component',
      );
    });

    it('should fail to create new training if training falls outside of the cycle date range', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: group.cycles[0].id,
        date: addDays(new Date(), 100),
        components: [generateTrainingComponent()],
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training falls outside of the selected cycle',
      );
    });

    it('should fail to create new training if training is in the past', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: group.cycles[1].id,
        date: subDays(new Date(), 1),
        components: [generateTrainingComponent()],
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot add or update trainings in the past',
      );
    });

    it('should fail to create new training if it exceeds daily training limit', async () => {
      const from = getTime(addDays(new Date(), 2), 8, 0);
      const trainings = [
        generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          date: from,
          components: [generateTrainingComponent({ id: 'other' })],
        }),
        generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          date: addHours(from, 1),
          components: [generateTrainingComponent({ id: 'other' })],
        }),
      ];

      const trainingIds = (
        await Promise.all(
          trainings.map((t) =>
            trainingService.create(global.trainer, {
              ...t,
              from,
            }),
          ),
        )
      ).map((t) => t.id);

      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: group.cycles[1].id,
        date: addHours(from, 2),
        components: [generateTrainingComponent({ id: 'other' })],
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Maximum number of trainings per day reached',
      );

      await db.trainings.deleteByIds(trainingIds);
    });

    it.each([
      getTime(addDays(new Date(), 2), 8, 0),
      getTime(addDays(new Date(), 2), 12, 0),
      getTime(addDays(new Date(), 2), 18, 0),
    ])(
      'should fail to create new training there is an overlap with other trainings',
      async (from) => {
        const trainingId = (
          await trainingService.create(
            global.trainer,
            generateTrainingStub({
              ownerId: global.trainer.uid,
              membersIds: [global.athlete.uid],
              groupId: group.id,
              cycleId: group.cycles[1].id,
              from,
              components: [generateTrainingComponent({ id: 'other' })],
            }),
          )
        ).id;

        const training = generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          from: subMinutes(from, 20),
          components: [generateTrainingComponent({ id: 'other' })],
        });

        const response = await req(global.trainer.token, training);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Training overlaps with other training',
        );

        await db.trainings.deleteByIds([trainingId]);
      },
    );

    it('should fail to create new training if training has invalid training component', async () => {
      const from = getTime(addDays(new Date(), 2), 8, 0);
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: 'invalid-component-id',
            from,
            to: addHours(from, 1),
          }),
          generateTrainingComponent({
            id: 'other',
            from: addHours(from, 1),
            to: addHours(from, 2),
          }),
        ],
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Component does not exist');
    });

    it('should fail to create new training if training has more components than the limit', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: 'c1',
            from: getTime(addDays(new Date(), 2), 8, 0),
            to: getTime(addDays(new Date(), 2), 8, 30),
          }),
          generateTrainingComponent({
            id: 'c2',
            from: getTime(addDays(new Date(), 2), 8, 30),
            to: getTime(addDays(new Date(), 2), 9, 0),
          }),
          generateTrainingComponent({
            id: 'c3',
            from: getTime(addDays(new Date(), 2), 9, 0),
            to: getTime(addDays(new Date(), 2), 9, 30),
          }),
          generateTrainingComponent({
            id: 'other',
            from: getTime(addDays(new Date(), 2), 9, 30),
            to: getTime(addDays(new Date(), 2), 10, 0),
          }),
        ],
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        `You can only have up to ${MAX_NUM_COMPONENTS_IN_TRAINING} components per training`,
      );
    });

    it('should fail to create new training if component is not root', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [generateTrainingComponent({ id: 'c1:leaf1' })],
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        `Component cannot be selected for training`,
      );
    });

    it('should fail to create new training if it contains duplicate components', async () => {
      const training = generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: 'other',
            from: getTime(addDays(new Date(), 2), 8, 0),
            to: getTime(addDays(new Date(), 2), 8, 30),
          }),
          generateTrainingComponent({
            id: 'other',
            from: getTime(addDays(new Date(), 2), 9, 0),
            to: getTime(addDays(new Date(), 2), 9, 30),
          }),
        ],
      });

      const response = await req(global.trainer.token, training);
      expect(response.status).toBe(400);
      expect(response.body.message).toContain(`Duplicate component`);
    });

    it.each([
      ['trainer', global.trainer],
      ['manager', global.manager],
    ])(
      'should successfully create institutional training if user is institution %s',
      async (_, user) => {
        // create overlapping training in another group to ensure no error is thrown
        const globalExercise = await exerciseService.create(
          global.admin,
          generateExerciseStub({ components: ['c1:leaf1'] }),
        );

        const exercise = await exerciseService.create(
          global.manager,
          generateExerciseStub({ components: ['c1:leaf1'] }),
        );

        const from = addDays(new Date(), 1);
        const training = generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          from,
          to: addHours(from, 1),
          components: [
            generateTrainingComponent({
              id: 'c1',
              supersets: [
                generateSuperset({
                  exercises: [
                    generateTrainingExercise({ id: globalExercise.id }),
                    generateTrainingExercise({ id: exercise.id }),
                  ],
                }),
              ],
            }),
          ],
        });

        const response = await req(user.token, training);
        expect(response.status).toBe(201);
        expect(response.body.groupId).toBe(group.id);
        expect(response.body.cycleId).toBe(group.cycles[1].id);
        expect(response.body.ownerId).toBe(user.uid);
        expect(response.body.membersIds).toEqual([global.athlete.uid]);
        expect(response.body.components).toHaveLength(1);
        expect(response.body.components[0].supersets).toHaveLength(1);
        expect(response.body.futureStats).not.toBeDefined();

        await Promise.all([
          db.exercises.deleteByIds([globalExercise.id, exercise.id]),
          db.trainings.deleteByIds([response.body.id]),
        ]);
      },
    );

    it('should create training for athlete', async () => {
      const from = addDays(new Date(), 1);
      const training = generateTrainingStub({
        ownerId: global.athlete.uid,
        membersIds: [],
        from,
        to: addHours(from, 1),
        components: [generateTrainingComponent({ id: 'c2' })],
      });

      const response = await req(global.athlete.token, training);
      expect(response.status).toBe(201);
      expect(response.body.ownerId).toBe(global.athlete.uid);
      expect(response.body.membersIds).toEqual([global.athlete.uid]);
      expect(response.body.components).toHaveLength(1);

      await db.trainings.deleteByIds([response.body.id]);
    });
  });

  describe('Training components', () => {
    async function addComponentReq(
      token: string,
      trainingId: string,
      components: Partial<CreateTrainingDto>['components'],
    ) {
      return await testApp.http.post(
        `/training/${trainingId}/component`,
        token,
        { components },
      );
    }

    it('should fail to add components if training does not exist', async () => {
      const response = await addComponentReq(
        global.trainer.token,
        'invalid-training-id',
        [generateTrainingComponent()],
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Training not found');
    });

    it('should fail to add components if user is not allowed to edit training', async () => {
      const training = await trainingService.create(
        global.trainer,
        generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: 'c1',
              supersets: [generateSuperset({})],
            }),
          ],
        }),
      );

      const response = await addComponentReq(
        global.athlete.token,
        training.id,
        [generateTrainingComponent({})],
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You cannot edit this training');

      await db.trainings.deleteByIds([training.id]);
    });

    it('should fail to add components if training is in the past', async () => {
      const training = await firebase.firestore
        .collection(FirestoreCollection.TRAINING)
        .add(
          firebase.buildCreateQuery(
            generateTrainingStub({
              ownerId: global.trainer.uid,
              membersIds: [global.athlete.uid],
              groupId: group.id,
              cycleId: group.cycles[0].id,
              from: subDays(new Date(), 2),
              to: subDays(new Date(), 2),
              components: [
                generateTrainingComponent({
                  from: subDays(new Date(), 2),
                  to: subDays(new Date(), 2),
                }),
              ],
            }),
            { timestamps: true },
          ),
        );

      const response = await addComponentReq(
        global.trainer.token,
        training.id,
        [generateTrainingComponent()],
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot add or update trainings in the past',
      );

      await db.trainings.deleteByIds([training.id]);
    });

    it('should fail to add components if there are duplicate components', async () => {
      const training = await trainingService.create(
        global.trainer,
        generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: 'c1',
              from: getTime(addDays(new Date(), 2), 8, 0),
              to: getTime(addDays(new Date(), 2), 9, 0),
            }),
          ],
        }),
      );

      const response = await addComponentReq(
        global.trainer.token,
        training.id,
        [
          generateTrainingComponent({
            id: 'c1',
            from: getTime(addDays(new Date(), 2), 9, 0),
            to: getTime(addDays(new Date(), 2), 10, 0),
          }),
        ],
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(`Duplicate component`);

      await db.trainings.deleteByIds([training.id]);
    });

    it('should successfully add training components', async () => {
      const d = addDays(new Date(), 2);
      const training = await trainingService.create(
        global.trainer,
        generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          from: getTime(d, 8, 0),
          components: [generateTrainingComponent({ id: 'c1' })],
        }),
      );

      const response = await addComponentReq(
        global.trainer.token,
        training.id,
        [generateTrainingComponent({ id: 'c2' })],
      );

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(training.id);
      expect(response.body.components).toHaveLength(2);

      // should update training times correctly
      const trainingFrom = new Date(response.body.from);
      const trainingTo = new Date(response.body.to);

      const c1From = new Date(response.body.components[0].from);
      const c1To = new Date(response.body.components[0].to);
      const c2From = new Date(response.body.components[1].from);
      const c2To = new Date(response.body.components[1].to);

      // should update training times correctly
      expectDatesToMatchUpToMinute(trainingFrom, getTime(d, 8));
      expectDatesToMatchUpToMinute(trainingTo, getTime(d, 9));

      // should update components times correctly
      expectDatesToMatchUpToMinute(c1From, getTime(d, 8, 0));
      expectDatesToMatchUpToMinute(c1To, getTime(d, 8, 30));
      expectDatesToMatchUpToMinute(c2From, getTime(d, 8, 30));
      expectDatesToMatchUpToMinute(c2To, getTime(d, 9, 0));

      await db.trainings.deleteByIds([training.id, response.body.id]);
    });

    it('should successfully delete training component', async () => {
      const training = await trainingService.create(
        global.trainer,
        generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: 'c1',
              supersets: [generateSuperset()],
              from: getTime(addDays(new Date(), 2), 8, 0),
              to: getTime(addDays(new Date(), 2), 9, 0),
            }),
            generateTrainingComponent({
              id: 'c2',
              supersets: [generateSuperset()],
              from: getTime(addDays(new Date(), 2), 9, 0),
              to: getTime(addDays(new Date(), 2), 10, 0),
            }),
          ],
        }),
      );

      const response = await testApp.http.delete(
        `/training/${training.id}/component/c2`,
        global.trainer.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(training.id);
      expect(response.body.components).toHaveLength(1);

      await db.trainings.deleteByIds([training.id, response.body.id]);
    });

    it('should delete training when training has no more components', async () => {
      const training = await trainingService.create(
        global.trainer,
        generateTrainingStub({
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: 'c1',
              supersets: [generateSuperset()],
            }),
          ],
        }),
      );

      const response = await testApp.http.delete(
        `/training/${training.id}/component/c1`,
        global.trainer.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(training.id);
      expect(response.body.components).toHaveLength(0);

      const trainings = await db.trainings.findAll();
      expect(trainings).toHaveLength(0);

      await Promise.all([db.trainings.delete(training.id)]);
    });
  });
});
