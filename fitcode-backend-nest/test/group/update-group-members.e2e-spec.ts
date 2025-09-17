import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { addDays, startOfDay, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import type { TestUser } from '@src/common/type/entity.type';
import {
  createAthleteUserAndToken,
  createTrainerUserAndToken,
} from '@src/common/utils/auth.util';
import { deleteUsers } from '@src/common/utils/data.util';
import { FirebaseService } from '@src/firebase/firebase.service';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { TestDbService } from '@src/test-db/test-db.service';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Update Group (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;
  let firebase: FirebaseService;

  let institutionId: string;
  let groupId: string;
  let athletes: TestUser[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    db = moduleFixture.get(TestDbService);

    athletes = await Promise.all([
      createAthleteUserAndToken(firebase),
      createAthleteUserAndToken(firebase),
      createAthleteUserAndToken(firebase),
    ]);

    institutionId = await db.institutions.save(
      generateInstitutionStub({ athleteIds: athletes.map((a) => a.uid) }),
    );

    groupId = await db.groups.save(
      generateGroupStub({
        institutionId,
        ownerId: global.trainer.uid,
        membersIds: athletes.map((a) => a.uid),
      }),
    );
  });

  afterAll(async () => {
    await deleteUsers(firebase, athletes);
    await db.cleanup();
    await app.close();
  });

  it('should fail if group does not exist', async () => {
    const nonExistentGroupId = 'non-existent-id';
    const response = await request(app.getHttpServer())
      .patch(`/group/${nonExistentGroupId}/member`)
      .set('Authorization', `Bearer ${global.manager.token}`)
      .send({ userId: 'userId' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Group does not exist');
  });

  it('should fail if user does not have permission to update group members', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${athletes[0].token}`)
      .send({ userId: athletes[1].uid });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden resource');
  });

  it('should fail if other trainer tries to update group members', async () => {
    const newTrainer = await createTrainerUserAndToken(firebase);
    const response = await request(app.getHttpServer())
      .patch(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${newTrainer.token}`)
      .send({ userId: athletes[0].uid });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      'You are not allowed to view this group',
    );

    await deleteUsers(firebase, [newTrainer]);
  });

  it('should fail if member does not exist', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: 'non-existent-user-id' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member does not exist');
  });

  it('should fail if member is not an athlete', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: global.manager.uid });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member must be an athlete');
  });

  it('should fail if member is already in the group', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: athletes[0].uid });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member is already in the group');
  });

  it('should fail if member is not part of the institution', async () => {
    const newAthlete = await createAthleteUserAndToken(firebase);
    const response = await request(app.getHttpServer())
      .patch(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: newAthlete.uid });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member is not part of the institution');

    await deleteUsers(firebase, [newAthlete]);
  });

  it('should successfully add a member to the group and all trainings', async () => {
    function training(date: Date) {
      return generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: athletes.map((a) => a.uid),
        institutionId,
        groupId,
        date,
      });
    }

    db.checkpoint();

    // 2 past and 3 future trainings
    await Promise.all([
      db.trainings.save(training(subDays(new Date(), 3))),
      db.trainings.save(training(subDays(new Date(), 3))),
      db.trainings.save(training(new Date())),
      db.trainings.save(training(new Date())),
      db.trainings.save(training(addDays(new Date(), 3))),
    ]);

    const newAthlete = await createAthleteUserAndToken(firebase);
    await db.institutions.addAthlete(institutionId, newAthlete.uid);

    const response = await request(app.getHttpServer())
      .patch(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: newAthlete.uid });

    expect(response.status).toBe(200);

    const group = await db.groups.findById(groupId);
    expect(group.membersIds).toContain(newAthlete.uid);
    expect(group.membersIds).toHaveLength(4);

    const trainings = await db.trainings.findAll();
    expect(trainings).toHaveLength(5);

    const date = startOfDay(new Date());
    const pastTrainings = trainings.filter((t) => t.from < date);
    const futureTrainings = trainings.filter((t) => t.from >= date);

    expect(pastTrainings).toHaveLength(2);
    expect(futureTrainings).toHaveLength(3);

    for (const training of futureTrainings) {
      expect(training.membersIds).toHaveLength(4);
      expect(training.membersIds).toContain(newAthlete.uid);
    }

    for (const training of pastTrainings) {
      expect(training.membersIds).toHaveLength(3);
      expect(training.membersIds).not.toContain(newAthlete.uid);
    }

    await db.checkpointRestore();
    await deleteUsers(firebase, [newAthlete]);

    // manually remove the athlete from the group
    await db.groups.removeMember(groupId, newAthlete.uid);
  });

  it('should successfully remove a member from the group and all future trainings', async () => {
    function training(date: Date) {
      return generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: athletes.map((a) => a.uid),
        institutionId,
        groupId,
        date,
      });
    }

    db.checkpoint();

    // 2 past and 3 future trainings
    await Promise.all([
      db.trainings.save(training(subDays(new Date(), 3))),
      db.trainings.save(training(subDays(new Date(), 3))),
      db.trainings.save(training(new Date())),
      db.trainings.save(training(new Date())),
      db.trainings.save(training(addDays(new Date(), 3))),
    ]);

    const response = await request(app.getHttpServer())
      .delete(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: athletes[0].uid });

    expect(response.status).toBe(200);

    const group = await db.groups.findById(groupId);
    expect(group.membersIds).not.toContain(athletes[0].uid);
    expect(group.membersIds).toHaveLength(2);

    const trainings = await db.trainings.findAll();
    expect(trainings).toHaveLength(5);

    const date = startOfDay(new Date());
    const pastTrainings = trainings.filter((t) => t.from < date);
    const futureTrainings = trainings.filter((t) => t.from >= date);
    expect(pastTrainings).toHaveLength(2);
    expect(futureTrainings).toHaveLength(3);

    for (const training of futureTrainings) {
      expect(training.membersIds).toHaveLength(2);
      expect(training.membersIds).not.toContain(athletes[0].uid);
    }

    for (const training of pastTrainings) {
      expect(training.membersIds).toHaveLength(3);
      expect(training.membersIds).toContain(athletes[0].uid);
    }

    await db.checkpointRestore();

    // manually add the athlete back to the group
    await db.groups.addMember(groupId, athletes[0].uid);
  });

  it('should not update members in other groups or trainings', async () => {
    function training(date: Date) {
      return generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: athletes.map((a) => a.uid),
        institutionId,
        groupId,
        date,
      });
    }

    db.checkpoint();

    const otherGroupId = await db.groups.save(
      generateGroupStub({
        institutionId,
        ownerId: global.trainer.uid,
        membersIds: athletes.map((a) => a.uid),
      }),
    );

    function other(date: Date) {
      return generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: athletes.map((a) => a.uid),
        institutionId,
        groupId: otherGroupId,
        date,
      });
    }

    // 2 past and 3 future trainings for the other group
    await Promise.all([
      db.trainings.save(other(subDays(new Date(), 3))),
      db.trainings.save(other(subDays(new Date(), 3))),
      db.trainings.save(other(new Date())),
      db.trainings.save(other(new Date())),
      db.trainings.save(other(addDays(new Date(), 3))),
    ]);

    // 2 past and 3 future trainings for the original group
    await Promise.all([
      db.trainings.save(training(subDays(new Date(), 3))),
      db.trainings.save(training(subDays(new Date(), 3))),
      db.trainings.save(training(new Date())),
      db.trainings.save(training(new Date())),
      db.trainings.save(training(addDays(new Date(), 3))),
    ]);

    const newAthlete = await createAthleteUserAndToken(firebase);
    await db.institutions.addAthlete(institutionId, newAthlete.uid);

    const response = await request(app.getHttpServer())
      .patch(`/group/${groupId}/member`)
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send({ userId: newAthlete.uid });

    expect(response.status).toBe(200);

    const group = await db.groups.findById(groupId);
    expect(group.membersIds).toContain(newAthlete.uid);
    expect(group.membersIds).toHaveLength(4);

    const trainings = await db.trainings.findAll();
    expect(trainings).toHaveLength(10);

    const date = startOfDay(new Date());
    const pastTrainingsG1 = trainings.filter(
      (t) => t.groupId === groupId && t.from < date,
    );

    const futureTrainingsG1 = trainings.filter(
      (t) => t.groupId === groupId && t.from >= date,
    );

    const pastTrainingsG2 = trainings.filter(
      (t) => t.groupId === otherGroupId && t.from < date,
    );

    const futureTrainingsG2 = trainings.filter(
      (t) => t.groupId === otherGroupId && t.from >= date,
    );

    expect(pastTrainingsG1).toHaveLength(2);
    expect(futureTrainingsG1).toHaveLength(3);
    expect(pastTrainingsG2).toHaveLength(2);
    expect(futureTrainingsG2).toHaveLength(3);

    for (const training of futureTrainingsG1) {
      expect(training.membersIds).toHaveLength(4);
      expect(training.membersIds).toContain(newAthlete.uid);
    }

    for (const training of pastTrainingsG1) {
      expect(training.membersIds).toHaveLength(3);
      expect(training.membersIds).not.toContain(newAthlete.uid);
    }

    for (const training of futureTrainingsG2) {
      expect(training.membersIds).toHaveLength(3);
      expect(training.membersIds).not.toContain(newAthlete.uid);
    }

    for (const training of pastTrainingsG2) {
      expect(training.membersIds).toHaveLength(3);
      expect(training.membersIds).not.toContain(newAthlete.uid);
    }

    await db.checkpointRestore();
    await deleteUsers(firebase, [newAthlete]);

    // manually remove the athlete from the group
    await db.groups.removeMember(groupId, newAthlete.uid);
  });
});
