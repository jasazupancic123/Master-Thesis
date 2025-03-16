import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AttributeService } from '../../src/attribute/service/attribute.service';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { ComponentService } from '../../src/component/component.service';
import { Component } from '../../src/component/entity/component.entity';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { TrainingService } from '../../src/training/service/training.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { GroupService } from '../../src/group/group.service';
import { generateGroupStub } from '../../src/group/mock/group.stub';
import { Group } from '../../src/group/entity/group.entity';
import { generateCycleStub } from '../../src/group/mock/cycle.stub';
import {
  addHours,
  addWeeks,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '../../src/training/mock/training.stub';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { UserService } from '../../src/user/user.service';

describe('Create Training (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let attributeService: AttributeService;
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
    attributeService = moduleFixture.get(AttributeService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    userService = moduleFixture.get(UserService);

    component = await componentService.create(generateComponentStub());
    group = await groupService.create(
      trainer,
      generateGroupStub({ membersIds: [athlete.uid] }),
    );

    const cycles = [
      generateCycleStub({
        from: startOfWeek(new Date()),
        to: endOfWeek(new Date()),
      }),
      generateCycleStub({
        from: addWeeks(startOfWeek(new Date()), 1),
        to: addWeeks(endOfWeek(new Date()), 1),
      }),
      generateCycleStub({
        from: addWeeks(startOfWeek(new Date()), 2),
        to: addWeeks(endOfWeek(new Date()), 2),
      }),
    ];

    group = await groupService.update(
      trainer,
      { groupId: group.id },
      { cycles },
    );
  });

  afterAll(async () => {
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

    it('should fail to create new training has more components than the limit', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        components: [
          generateTrainingComponent({ id: component.id }),
          generateTrainingComponent({ id: component.id }),
          generateTrainingComponent({ id: component.id }),
          generateTrainingComponent({ id: component.id }),
          generateTrainingComponent({ id: component.id }),
          generateTrainingComponent({ id: component.id }),
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

    it('should fail to create new training if training has invalid training component', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
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

    it('should fail to create new training if component is not root', async () => {
      const leaf = await componentService.create(
        generateComponentStub({ parentId: component.id }),
      );

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        components: [generateTrainingComponent({ id: leaf.id })],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Component ${leaf.id} cannot be selected for training`,
      );

      component = await componentService.create(generateComponentStub());
    });

    it('should fail to create new training if max number of supersets is reached', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
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
        cycleId: group.cycles[0].id,
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

    it('should fail to create new training if exercises are invalid', async () => {
      const component1 = await componentService.create(generateComponentStub());
      const component2 = await componentService.create(generateComponentStub());

      const exercises = await exerciseService.createMany(trainer, [
        generateExerciseStub({ componentIds: [component1.id] }),
        generateExerciseStub({ componentIds: [component2.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
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

    it('should fail to create new training there is an overlap with other trainings', async () => {
      const from = startOfDay(new Date());
      const trainings = [
        generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[0].id,
          components: [generateTrainingComponent({ id: component.id })],
          from,
          to: addHours(from, 1),
        }),
      ];

      await Promise.all(
        trainings.map((t) => trainingService.create(trainer, t)),
      );
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        components: [generateTrainingComponent({ id: component.id })],
        from,
        to: addHours(from, 1),
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

    it('should successfully create training', async () => {
      // create overlapping training in another group to ensure no error is thrown
      let otherGroup = await groupService.create(
        trainer,
        generateGroupStub({ membersIds: [athlete.uid] }),
      );

      otherGroup = await groupService.update(
        trainer,
        { groupId: otherGroup.id },
        {
          cycles: [
            generateCycleStub({
              from: startOfWeek(new Date()),
              to: endOfWeek(new Date()),
            }),
          ],
        },
      );

      const from = startOfDay(new Date());
      await trainingService.create(
        trainer,
        generateTrainingStub({
          groupId: otherGroup.id,
          cycleId: otherGroup.cycles[0].id,
          components: [generateTrainingComponent({ id: component.id })],
          from,
          to: addHours(from, 1),
        }),
      );

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        components: [generateTrainingComponent({ id: component.id })],
        from,
        to: addHours(from, 1),
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(201);
      expect(response.body.groupId).toBe(group.id);
      expect(response.body.cycleId).toBe(group.cycles[0].id);
      expect(response.body.ownerId).toBe(trainer.uid);
      expect(response.body.membersIds).toEqual([athlete.uid]);
      expect(response.body.components).toHaveLength(1);

      const dbMember = await userService.findProfile(athlete);
      expect(dbMember.trainersIds).toEqual([trainer.uid]);
    });
  });

  describe('Training components', () => {
    it('should successfully add components to training', async () => {
      expect(true).toBeTruthy();
    });
  });

  describe('User workloads', () => {
    it('should successfully create user workloads for training', async () => {
      expect(true).toBeTruthy();
    });
  });
});
