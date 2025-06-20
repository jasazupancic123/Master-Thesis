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
import { Group } from '../../src/group/entity/group.entity';
import { UserService } from '../../src/user/user.service';
import {
  generateTrainingComponent,
  generateTrainingStub,
} from '../../src/training/mock/training.stub';
import { createGroupWithCycles, getTime } from '../utils/data.util';
import { Training } from '../../src/training/entity/training.entity';
import { addDays, addMinutes, subDays } from 'date-fns';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { generateInstitutionStub } from '../../src/institution/mock/institution.mock';

describe('Update Training (e2e)', () => {
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
  let training: Training;

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

    const institutionService = moduleFixture.get(InstitutionService);
    const institution = await institutionService.create(
      global.admin,
      generateInstitutionStub(),
    );

    component = await componentService.create(generateComponentStub());
    group = await createGroupWithCycles(groupService, {
      institutionId: institution.id,
      owner: trainer,
      membersIds: [athlete.uid],
    });

    training = await createTraining();
  });

  afterAll(async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await firebaseService.deleteCollection(FirestoreCollection.GROUP);
    await firebaseService.deleteCollection(FirestoreCollection.TRAINING);
    await app.close();
  });

  async function createTraining(data?: Partial<Training>) {
    const from = data?.from || getTime(addDays(new Date(), 2), 8, 0); // defaults to 8:00 two days ahead
    const to = data?.to || addMinutes(from, 60); // defaults to 9:00 two days ahead

    return await trainingService.create(
      trainer,
      generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [generateTrainingComponent({ id: component.id, from, to })],
        ...(data ? data : {}),
      }),
    );
  }

  describe('Update training', () => {
    it('should fail to update training if training id not found', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/invalid-id`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Training not found`);
    });

    it('should fail to update training if user is not the owner', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${athlete.token}`)
        .send(training);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not authorized to perform this action',
      );
    });

    it('should fail to update training if training is not in cycle', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send({
          ...training,
          components: [
            generateTrainingComponent({
              id: component.id,
              from: getTime(addDays(new Date(), 100), 8, 0),
              to: getTime(addDays(new Date(), 100), 8, 30),
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training falls outside of the selected cycle',
      );
    });

    it('should fail to update training if training is in the past', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send({
          ...training,
          components: [
            generateTrainingComponent({
              id: component.id,
              from: getTime(subDays(new Date(), 2), 8, 0),
              to: getTime(subDays(new Date(), 2), 8, 30),
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training falls outside of the selected cycle',
      );
    });

    it('should delete training if there are not any components left', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send({ ...training, components: [] });

      const trainings = await trainingService.findAll(trainer);
      expect(response.status).toBe(200);
      expect(trainings).toHaveLength(0);

      await firebaseService.deleteCollection(FirestoreCollection.TRAINING);
      training = await createTraining();
    });

    it('should fail to update training if there is overlap between trainings', async () => {
      await createTraining({ from: getTime(addDays(new Date(), 2), 9, 30) });

      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send({
          ...training,
          components: [
            generateTrainingComponent({
              id: component.id,
              from: getTime(addDays(new Date(), 2), 10, 0),
              to: getTime(addDays(new Date(), 2), 10, 30),
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training overlaps with other training',
      );

      await firebaseService.deleteCollection(FirestoreCollection.TRAINING);
      training = await createTraining();
    });

    it('should fail to update training if some members are invalid', async () => {});

    it('should successfully update training and create training workloads', async () => {});

    it('should create new workloads if new user is added to training / training group', async () => {});

    it('should not remove workloads if user is removed from training / training group', async () => {});
  });

  describe('Copy training', () => {
    it('should fail to copy training if group not found', async () => {
      const data = generateTrainingStub({
        ...training,
        groupId: 'invalid-group-id',
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(data);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Group does not exist`);
    });
  });

  describe('Delete training', () => {
    it('should fail to delete training if group not found', async () => {
      const data = generateTrainingStub({
        ...training,
        groupId: 'invalid-group-id',
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(data);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Group does not exist`);
    });
  });
});
