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

describe('Get Trainings (e2e)', () => {
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
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await firebaseService.deleteCollection(FirestoreCollection.GROUP);
    await firebaseService.deleteCollection(FirestoreCollection.TRAINING);
    await app.close();
  });

  it('should successfully fetch all trainings by owner', async () => {
    const training = generateTrainingStub({ groupId: 'invalid-group-id' });

    const response = await request(app.getHttpServer())
      .post('/training')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(training);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(`Group does not exist`);
  });
});
