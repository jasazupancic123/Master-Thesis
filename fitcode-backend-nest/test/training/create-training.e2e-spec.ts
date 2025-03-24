import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { ComponentService } from '../../src/component/component.service';
import { Component } from '../../src/component/entity/component.entity';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { TrainingService } from '../../src/training/service/training.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { GroupService } from '../../src/group/group.service';
import { Group } from '../../src/group/entity/group.entity';
import { addDays, addHours, subDays } from 'date-fns';
import {
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '../../src/training/mock/training.stub';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { UserService } from '../../src/user/user.service';
import { createGroupWithCycles } from '../utils/data.util';
import {
  DEFAULT_PARAMS_KEY,
  PARAMS,
} from '../../src/component/constant/param.constant';
import { ParamType } from '../../src/component/enum/param.enum';
import { TrainingComponent } from '../../src/training/entity/training-component.entity';

describe('Create Training (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let userService: UserService;

  let group: Group;
  let component: Component;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    userService = moduleFixture.get(UserService);

    component = await componentService.create(generateComponentStub());
    group = await createGroupWithCycles(groupService, {
      owner: trainer,
      membersIds: [athlete.uid],
    });
  });

  afterAll(async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await firebaseService.deleteCollection(FirestoreCollection.GROUP);
    await firebaseService.deleteCollection(FirestoreCollection.TRAINING);
    await app.close();
  });

  describe('Create training', () => {
    it('should fail to create new training if group not found', async () => {
      const training = generateTrainingStub({ groupId: 'invalid-group-id' });
      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Group does not exist`);
    });

    it('should fail to create new training if cycle not found', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: 'invalid-cycle-id',
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Cycle does not exist`);
    });

    it('should fail to create new training if user is not owner of the group', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${athlete.token}`)
        .send(training);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not authorized to perform this action',
      );
    });

    it('should fail to create new training if training falls outside of the cycle date range', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        from: addDays(new Date(), 100),
        to: addDays(new Date(), 101),
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training falls outside of the selected cycle',
      );
    });

    it('should fail to create new training if training is in the past', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        from: subDays(new Date(), 2),
        to: subDays(new Date(), 2),
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot add or update trainings in the past',
      );
    });

    it('should fail to create new training if it exceeds daily training limit', async () => {
      const from = addDays(new Date(), 2);
      const trainings = [
        generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [generateTrainingComponent({ id: component.id })],
          from: addHours(from, 1),
          to: addHours(from, 1),
        }),
        generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [generateTrainingComponent({ id: component.id })],
          from: addHours(from, 2),
          to: addHours(from, 2),
        }),
      ];

      await Promise.all(
        trainings.map((t) => trainingService.create(trainer, t)),
      );

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [generateTrainingComponent({ id: component.id })],
        from: addHours(from, 3),
        to: addHours(from, 3),
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Maximum number of trainings per day reached',
      );

      await firebaseService.deleteCollection(FirestoreCollection.TRAINING);
    });

    it('should fail to create new training there is an overlap with other trainings', async () => {
      const from = addDays(new Date(), 2);
      const trainings = [
        generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [generateTrainingComponent({ id: component.id })],
          from,
          to: from,
        }),
      ];

      await Promise.all(
        trainings.map((t) => trainingService.create(trainer, t)),
      );

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [generateTrainingComponent({ id: component.id })],
        from,
        to: from,
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training overlaps with other training',
      );

      await firebaseService.deleteCollection(FirestoreCollection.TRAINING);
    });

    it('should fail to create new training if training has invalid training component', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({ id: 'invalid-component-id' }),
          generateTrainingComponent({ id: component.id }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Component does not exist');
    });

    it('should fail to create new training if training has more components than the limit', async () => {
      const components = await Promise.all([
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            from: addHours(new Date(), 1),
          }),
          generateTrainingComponent({
            id: components[0].id,
            from: addHours(new Date(), 2),
          }),
          generateTrainingComponent({
            id: components[1].id,
            from: addHours(new Date(), 3),
          }),
          generateTrainingComponent({
            id: components[2].id,
            from: addHours(new Date(), 4),
          }),
          generateTrainingComponent({
            id: components[3].id,
            from: addHours(new Date(), 5),
          }),
          generateTrainingComponent({
            id: components[4].id,
            from: addHours(new Date(), 6),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'You can only have up to 5 components per training',
      );
    });

    it('should fail to create new training if component is not root', async () => {
      const leaf = await componentService.create(
        generateComponentStub({ parentId: component.id }),
      );

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [generateTrainingComponent({ id: leaf.id })],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Component ${leaf.name} cannot be selected for training`,
      );

      component = await componentService.create(generateComponentStub());
    });

    it('should fail to create new training if it contains duplicate components', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            from: addHours(new Date(), 1),
          }),
          generateTrainingComponent({
            id: component.id,
            from: addHours(new Date(), 2),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Duplicate component ${component.name}`,
      );
    });

    it('should fail to create new training if training components times are not valid', async () => {
      const components = await Promise.all([
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: components[0].id,
            from: addHours(new Date(), 1),
          }),
          generateTrainingComponent({
            id: components[1].id,
            from: addHours(new Date(), 1),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Component ${components[0].name} has to start before ${components[1].name}`,
      );
    });

    it('should fail to create new training if max number of supersets is reached', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'You can only have up to 8 supersets per training component',
      );
    });

    it('should fail to create new training if max number of training exercises per superset is reached', async () => {
      const component = await componentService.create(generateComponentStub());
      const exercises = await exerciseService.createMany(trainer, [
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[1].id }),
                  generateTrainingExercise({ id: exercises[2].id }),
                  generateTrainingExercise({ id: exercises[3].id }),
                  generateTrainingExercise({ id: exercises[4].id }),
                ],
              }),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'You can only have up to 4 exercises per superset',
      );
    });

    it('should fail to create new training if user is in multiple subgroups', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [generateSuperset()],
            subgroups: [
              generateSubgroup({ membersIds: [athlete.uid] }),
              generateSubgroup({ membersIds: [athlete.uid] }),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        `Member ${athlete.uid} cannot be in multiple subgroups in the same training component`,
      );
    });

    it('should fail to create new training if exercises are invalid', async () => {
      const component1 = await componentService.create(generateComponentStub());
      const component2 = await componentService.create(generateComponentStub());

      const exercises = await exerciseService.createMany(trainer, [
        generateExerciseStub({ componentIds: [component1.id] }),
        generateExerciseStub({ componentIds: [component2.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component1.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[1].id }),
                ],
              }),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Exercise ${exercises[1].name} cannot be part of selected component`,
      );
    });

    it('should successfully create training', async () => {
      // create overlapping training in another group to ensure no error is thrown
      const otherGroup = await createGroupWithCycles(groupService, {
        owner: trainer,
        membersIds: [athlete.uid],
      });

      const component = await componentService.create(
        generateComponentStub({
          params: {
            [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWorkSets }],
          },
        }),
      );

      const from = addDays(new Date(), 1);
      await trainingService.create(
        trainer,
        generateTrainingStub({
          groupId: otherGroup.id,
          cycleId: otherGroup.cycles[1].id,
          components: [generateTrainingComponent({ id: component.id })],
          from,
          to: addHours(from, 1),
        }),
      );

      const exercises = await exerciseService.createMany(trainer, [
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        from,
        to: addHours(from, 1),
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: exercises[0].id })],
              }),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(201);
      expect(response.body.groupId).toBe(group.id);
      expect(response.body.cycleId).toBe(group.cycles[1].id);
      expect(response.body.ownerId).toBe(trainer.uid);
      expect(response.body.membersIds).toEqual([athlete.uid]);
      expect(response.body.components).toHaveLength(1);

      // all training exercises should have correct component params
      const trainingExercises = (
        response.body.components as TrainingComponent[]
      ).flatMap((c) => c.supersets.flatMap((s) => s.exercises));

      for (const e of trainingExercises) {
        expect(e.params).toEqual([
          PARAMS.find((p) => p.field === ParamType.VolWorkSets),
        ]);
      }

      // it should add trainer id to user
      const dbMember = await userService.findProfile(athlete);
      expect(dbMember.trainersIds).toEqual([trainer.uid]);

      // it should create user workloads
    });
  });

  describe('Training components', () => {
    it('should successfully add components to training', async () => {
      expect(true).toBeTruthy();
    });
  });
});
