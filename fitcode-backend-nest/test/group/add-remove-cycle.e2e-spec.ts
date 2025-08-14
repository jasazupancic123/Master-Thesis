import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { createTrainerUserAndToken } from '@test/common/utils/auth.util';
import { deleteUsers } from '@test/common/utils/data.util';
import { addMonths } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { FirebaseService } from '@src/firebase/firebase.service';
import { generateCycleStub } from '@src/group/mock/cycle.stub';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { TestDbService } from '@src/test-db/test-db.service';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Add / Remove Group Cycle (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;
  let firebase: FirebaseService;

  let groupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);

    const institutionId = await db.institutions.addDoc(
      generateInstitutionStub(),
    );

    groupId = await db.groups.addDoc(
      generateGroupStub({
        institutionId,
        cycles: [generateCycleStub({ id: 'existing-cycle-id' })],
      }),
    );
  });

  afterAll(async () => {
    await db.cleanup();
    await app.close();
  });

  describe('Add Cycle', () => {
    it.each([
      ['admin', global.admin.token],
      ['athlete', global.athlete.token],
    ])('should fail if user is %s', async (_, token) => {
      const response = await request(app.getHttpServer())
        .post(`/group/${groupId}/cycle`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden resource');
    });

    it('should fail if user cannot edit group', async () => {
      const otherTrainer = await createTrainerUserAndToken(firebase);
      const response = await request(app.getHttpServer())
        .post(`/group/${groupId}/cycle`)
        .set('Authorization', `Bearer ${otherTrainer.token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not allowed to view this group',
      );

      await deleteUsers(firebase, [otherTrainer]);
    });

    it('should fail if cycle already exists in group', async () => {
      const cycleId = 'existing-cycle-id';
      const response = await request(app.getHttpServer())
        .post(`/group/${groupId}/cycle`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send(generateCycleStub({ id: cycleId }));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cycle already exists in the group');
    });

    it('should fail if cycle overlaps with existing cycles', async () => {
      const overlappingCycle = generateCycleStub({
        from: new Date(),
        to: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post(`/group/${groupId}/cycle`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send(overlappingCycle);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Cycle overlaps with existing cycles in the group',
      );
    });

    it('should successfully add cycle to group', async () => {
      db.checkpoint();

      const newCycle = generateCycleStub({
        name: 'New Cycle',
        from: addMonths(new Date(), 1),
        to: addMonths(new Date(), 2),
      });

      const response = await request(app.getHttpServer())
        .post(`/group/${groupId}/cycle`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send(newCycle);

      expect(response.status).toBe(201);

      const group = await db.groups.getDoc(groupId);
      expect(group.cycles.length).toBe(2);
      expect(group.cycles[1].name).toBe(newCycle.name);

      await db.checkpointRestore();
    });
  });

  describe('Remove Cycle', () => {
    it.each([
      ['admin', global.admin.token],
      ['athlete', global.athlete.token],
    ])('should fail if user is %s', async (_, token) => {
      const response = await request(app.getHttpServer())
        .delete(`/group/${groupId}/cycle/existing-cycle-id`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden resource');
    });

    it('should fail if user cannot edit group', async () => {
      const otherTrainer = await createTrainerUserAndToken(firebase);
      const response = await request(app.getHttpServer())
        .delete(`/group/${groupId}/cycle/existing-cycle-id`)
        .set('Authorization', `Bearer ${otherTrainer.token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You are not allowed to view this group',
      );

      await deleteUsers(firebase, [otherTrainer]);
    });

    it('should successfully remove cycle from group', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/group/${groupId}/cycle/existing-cycle-id`)
        .set('Authorization', `Bearer ${global.trainer.token}`);

      expect(response.status).toBe(200);

      const group = await db.groups.getDoc(groupId);
      expect(group.cycles.length).toBe(0);

      await db.groups.updateDoc(groupId, {
        cycles: [generateCycleStub({ id: 'existing-cycle-id' })],
      });
    });

    it('should successfully remove cycle and all trainings', async () => {
      const cycleId = 'existing-cycle-id';
      const otherGroupId = await db.groups.addDoc(
        generateGroupStub({ institutionId: groupId }),
      );

      // create 5 trainings for groupId and 5 for otherGroupId
      for (let i = 0; i < 10; i++)
        await db.trainings.addDoc(
          generateTrainingStub({
            groupId: i < 5 ? groupId : otherGroupId,
            ownerId: global.trainer.uid,
            membersIds: [global.athlete.uid],
            cycleId: cycleId,
          }),
        );

      const trainings = await db.trainings.getDocs();
      expect(trainings.length).toBe(10);

      const groupTrainingsBefore = trainings.filter(
        (training) =>
          training.groupId === groupId && training.cycleId === cycleId,
      );
      expect(groupTrainingsBefore.length).toBe(5);

      const otherGroupTrainingsBefore = trainings.filter(
        (training) => training.groupId === otherGroupId,
      );
      expect(otherGroupTrainingsBefore.length).toBe(5);

      const response = await request(app.getHttpServer())
        .delete(`/group/${groupId}/cycle/${cycleId}`)
        .set('Authorization', `Bearer ${global.trainer.token}`);

      expect(response.status).toBe(200);

      const groups = await db.groups.getDocs();
      expect(groups.length).toBe(2); // otherGroupId should still exist

      const trainingsAfterDelete = await db.trainings.getDocs();
      expect(trainingsAfterDelete.length).toBe(5);

      const groupTrainingsAfter = trainingsAfterDelete.filter(
        (training) =>
          training.groupId === groupId && training.cycleId === cycleId,
      );
      expect(groupTrainingsAfter.length).toBe(0);

      const otherGroupTrainingsAfter = trainingsAfterDelete.filter(
        (training) => training.groupId === otherGroupId,
      );
      expect(otherGroupTrainingsAfter.length).toBe(5);
    });
  });
});
