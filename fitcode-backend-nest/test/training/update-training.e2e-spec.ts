import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { TestDbService } from '@test/common/db/test-db.service';
import { addDays, addMinutes, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import type { Training } from '@src/training/entity/training.entity';
import {
  generateTrainingComponent,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { generateWorkloadStub } from '@src/training/mock/workload.stub';
import { TrainingService } from '@src/training/service/training.service';

import type { TestInstitution } from '../common/type/entity.type';
import { createAthleteUserAndToken } from '../common/utils/auth.util';
import {
  createGroupWithCycles,
  createInstitution,
  createInstitutionWithUsers,
  deleteDoc,
  deleteDocs,
  deleteInstitution,
  deleteUsers,
} from '../common/utils/data.util';
import { getTime } from '../common/utils/date.util';
import { CreatePrescribedWorkloadDto } from '@src/training/dto/create-workload.dto';

describe('Update Training (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let firebase: FirebaseService;
  let componentService: ComponentService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let institutionService: InstitutionService;

  let component: Component;

  // first institution
  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  // other institution
  let otherInstitution: TestInstitution;
  let otherGroup: Group;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);

    component = await componentService.create(generateComponentStub());
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
      deleteDoc(firebase, 'COMPONENT', component.id),
    ]);

    await app.close();
  });

  async function createTraining(
    data?: Partial<Training>,
    workloads?: CreatePrescribedWorkloadDto[],
  ) {
    const from = data?.from || getTime(addDays(new Date(), 2), 8, 0); // defaults to 8:00 two days ahead
    const to = data?.to || addMinutes(from, 60); // defaults to 9:00 two days ahead

    let training = await trainingService.create(
      global.trainer,
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [generateTrainingComponent({ id: component.id, from, to })],
        ...(data ? data : {}),
      }),
    );

    if (workloads)
      training = await trainingService.update(
        global.trainer,
        { trainingId: training.id },
        { workloads },
      );

    return training;
  }

  describe('Update training', () => {
    it('should fail to update training if training id not found', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/invalid-id`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Training not found`);
    });

    it('should fail to update training if users from same institution without permission try to edit it', async () => {
      const responses = await Promise.all(
        [global.athlete].map((user) =>
          request(app.getHttpServer())
            .patch(`/training/${training.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send(training),
        ),
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
        ].map((user) =>
          request(app.getHttpServer())
            .patch(`/training/${training.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send(training),
        ),
      );

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(`You cannot view this training`);
      }
    });

    it('should fail to update training if training is not in cycle', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
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
        .set('Authorization', `Bearer ${global.trainer.token}`)
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
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({ ...training, components: [] });

      const trainings = await trainingService.findAll(global.trainer);
      expect(response.status).toBe(200);
      expect(trainings).toHaveLength(0);

      await deleteDoc(firebase, 'TRAINING', training.id);
      training = await createTraining();
    });

    it('should fail to update training if there is overlap between trainings', async () => {
      const prevTraining = await createTraining({
        from: getTime(addDays(new Date(), 2), 9, 30),
      });

      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
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

      await deleteDocs(firebase, 'TRAINING', [prevTraining.id, training.id]);
      training = await createTraining();
    });

    it('should fail to update training if training is in institution and trainer / manager wants to add members outside the institution', async () => {
      const newAthlete = await createAthleteUserAndToken(firebase);
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({ ...training, membersIds: [newAthlete.uid] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `User ${newAthlete.displayName || newAthlete.email} is not part of institution`,
      );

      await Promise.all([
        deleteUsers(firebase, [newAthlete]),
        deleteDoc(firebase, 'TRAINING', training.id),
      ]);

      training = await createTraining();
    });
  });

  describe('Copy training', () => {
    it('should fail to copy training if group not found', async () => {
      const data = generateTrainingStub({
        ...training,
        groupId: 'invalid-group-id',
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${global.trainer.token}`)
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
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send(data);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Group does not exist`);
    });
  });

  describe('Custom workloads', () => {
    it('should fail if training component is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadStub({ componentId: 'invalid-component-id' }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Invalid component provided in workload',
      );
    });

    it('should fail if exercise does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadStub({
              componentId: component.id,
              exerciseId: 'invalid-exercise-id',
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Exercise does not exist`);
    });

    it('should fail if exercise not prescribed in superset', async () => {
      const exercise = await db.exercises.create({
        ownerId: institution.id,
        componentIds: [component.id],
      });

      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadStub({
              componentId: component.id,
              exerciseId: 'invalid-exercise-id',
              supersetIndex: 1,
            }),
          ],
        });

      expect(response.status).toBe(400);
      /* expect(response.body.message).toBe(
        `Exercise ${exercise.name} is not prescribed in superset ${
          customWorkload.supersetIndex + 1
        }`,
      ); */

      await db.exercises.delete(exercise.id);
    });
  });
});
