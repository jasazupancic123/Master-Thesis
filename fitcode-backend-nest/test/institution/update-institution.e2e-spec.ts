import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TestUser } from '@test/common/type/auth.type';
import {
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from '@test/common/utils/auth.util';
import { deleteUsers } from '@test/common/utils/data.util';
import { addDays, isAfter, isBefore, startOfDay, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { FirebaseService } from '@src/firebase/firebase.service';
import { GroupService } from '@src/group/group.service';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { TestDbService } from '@src/test-db/test-db.service';
import {
  generateSubgroup,
  generateTrainingComponent,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';

describe('Update Institution (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;
  let firebase: FirebaseService;

  let groupService: GroupService;
  let trainingService: TrainingService;

  let institutionId: string;
  let athletes: TestUser[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    db = moduleFixture.get(TestDbService);
    groupService = moduleFixture.get(GroupService);
    trainingService = moduleFixture.get(TrainingService);

    institutionId = await db.institutions.addDoc(generateInstitutionStub());
    athletes = await Promise.all([
      createAthleteUserAndToken(firebase),
      createAthleteUserAndToken(firebase),
      createAthleteUserAndToken(firebase),
    ]);
  });

  afterAll(async () => {
    await deleteUsers(firebase, athletes);
    await db.cleanup();
    await app.close();
  });

  describe('Update Members', () => {
    it('should fail if institution does not exist', async () => {
      const nonExistentInstitutionId = 'non-existent-id';
      const response = await request(app.getHttpServer())
        .patch(`/institution/${nonExistentInstitutionId}/athlete`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId: 'userId' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Institution not found');
    });

    it('should fail if user is not authorized', async () => {
      const otherManager = await createManagerUserAndToken(firebase);

      const response = await request(app.getHttpServer())
        .patch(`/institution/${institutionId}/athlete`)
        .set('Authorization', `Bearer ${otherManager.token}`)
        .send({ userId: 'userId' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You cannot edit this institution');

      await deleteUsers(firebase, [otherManager]);
    });

    it('should fail if user does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/institution/${institutionId}/athlete`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId: 'non-existent-user-id' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Member does not exist');
    });

    it('should successfully add an athlete to the institution', async () => {
      const userId = athletes[0].uid;
      const response = await request(app.getHttpServer())
        .patch(`/institution/${institutionId}/athlete`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId });

      expect(response.status).toBe(200);

      const institution = await db.institutions.getDoc(institutionId);
      expect(institution.athleteIds).toHaveLength(2);
      expect(institution.athleteIds).toContain(userId);
    });

    it('should successfully add an athlete to the institution and its groups and trainings', async () => {
      const membersIds = [athletes[0], athletes[1]].map((a) => a.uid); // only the first two athletes
      const newAthlete = athletes[2];

      db.checkpoint();

      const existingGroups = await Promise.all([
        db.groups.addDoc(generateGroupStub({ institutionId, membersIds })),
        db.groups.addDoc(generateGroupStub({ institutionId, membersIds })),
        db.groups.addDoc(generateGroupStub({ institutionId, membersIds })),
      ]);

      const training = {
        ownerId: global.trainer.uid,
        membersIds,
        institutionId,
      };

      // 2 past and 3 future trainings
      await Promise.all([
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[0],
            date: subDays(new Date(), 3),
          }),
        ),
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[0],
            date: subDays(new Date(), 2),
          }),
        ),
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[1],
            date: new Date(),
          }),
        ),
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[1],
            date: new Date(),
          }),
        ),
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[2],
            date: addDays(new Date(), 3),
          }),
        ),
      ]);

      // spies
      const groupServiceSpy = jest.spyOn(
        groupService,
        'handleUpdateInstitutionAthleteEvent',
      );
      const trainingServiceSpy = jest.spyOn(
        trainingService,
        'handleUpdateInstitutionAthleteEvent',
      );

      const response = await request(app.getHttpServer())
        .patch(`/institution/${institutionId}/athlete`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId: newAthlete.uid });

      expect(response.status).toBe(200);

      const institution = await db.institutions.getDoc(institutionId);
      expect(institution.athleteIds).toHaveLength(3);
      expect(institution.athleteIds).toContain(newAthlete.uid);

      for (const serviceSpy of [groupServiceSpy, trainingServiceSpy]) {
        expect(serviceSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            institutionId,
            userId: newAthlete.uid,
            add: true,
          }),
        );

        serviceSpy.mockClear();
      }

      const groups = await db.groups.getDocs();
      expect(groups).toHaveLength(3);
      for (const group of groups) {
        expect(group.membersIds).toHaveLength(3);
        expect(group.membersIds).toContain(newAthlete.uid);
      }

      const trainings = await db.trainings.getDocs();
      expect(trainings).toHaveLength(5);

      const date = startOfDay(new Date());
      const pastTrainings = trainings.filter((t) => isBefore(t.from, date));
      const futureTrainings = trainings.filter((t) => isAfter(t.from, date));

      expect(pastTrainings).toHaveLength(2);
      expect(futureTrainings).toHaveLength(3);

      for (const training of futureTrainings) {
        expect(training.membersIds).toHaveLength(3);
        expect(training.membersIds).toContain(newAthlete.uid);
      }

      for (const training of pastTrainings) {
        expect(training.membersIds).toHaveLength(2);
        expect(training.membersIds).not.toContain(newAthlete.uid);
      }

      await db.checkpointRestore();
    });

    it('should successfully remove an athlete from the institution', async () => {
      const membersIds = [athletes[0], athletes[1]].map((a) => a.uid); // only the first two athletes
      const userId = athletes[0].uid; // user to remove

      // delete institution and recreate it to reset the state
      await db.institutions.deleteDoc(institutionId);
      institutionId = await db.institutions.addDoc(
        generateInstitutionStub({ athleteIds: membersIds }),
      );

      db.checkpoint();

      const existingGroups = await Promise.all([
        db.groups.addDoc(generateGroupStub({ institutionId, membersIds })),
        db.groups.addDoc(generateGroupStub({ institutionId, membersIds })),
        db.groups.addDoc(generateGroupStub({ institutionId, membersIds })),
      ]);

      const training = {
        ownerId: global.trainer.uid,
        membersIds,
        institutionId,
      };

      // 2 past and 3 future trainings
      await Promise.all([
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[0],
            date: subDays(new Date(), 3),
          }),
        ),
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[0],
            date: subDays(new Date(), 3),
          }),
        ),
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[1],
            date: new Date(),
          }),
        ),
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[1],
            date: new Date(),
          }),
        ),
        db.trainings.addDoc(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[2],
            date: addDays(new Date(), 3),
          }),
        ),
      ]);

      const response = await request(app.getHttpServer())
        .delete(`/institution/${institutionId}/athlete`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId });

      expect(response.status).toBe(200);
      const institution = await db.institutions.getDoc(institutionId);
      expect(institution.athleteIds).toHaveLength(1);
      expect(institution.athleteIds).not.toContain(userId);

      const groups = await db.groups.getDocs();
      expect(groups).toHaveLength(3);
      for (const group of groups) {
        expect(group.membersIds).toHaveLength(1);
        expect(group.membersIds).not.toContain(userId);
      }

      const trainings = await db.trainings.getDocs();
      expect(trainings).toHaveLength(5);

      const date = startOfDay(new Date());
      const pastTrainings = trainings.filter((t) => isBefore(t.from, date));
      const futureTrainings = trainings.filter((t) => isAfter(t.from, date));

      expect(pastTrainings).toHaveLength(2);
      expect(futureTrainings).toHaveLength(3);

      for (const training of futureTrainings) {
        expect(training.membersIds).toHaveLength(1);
        expect(training.membersIds).not.toContain(userId);
      }

      for (const training of pastTrainings) {
        expect(training.membersIds).toHaveLength(2);
        expect(training.membersIds).toContain(userId);
      }

      await db.checkpointRestore();
    });

    it('should fail to add trainer if user is not a trainer', async () => {
      const nonTrainer = await createAthleteUserAndToken(firebase);
      const response = await request(app.getHttpServer())
        .patch(`/institution/${institutionId}/trainer`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId: nonTrainer.uid });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Member must be a trainer to be added as a trainer',
      );

      await deleteUsers(firebase, [nonTrainer]);
    });

    it('should successfully add a trainer to the institution', async () => {
      const newTrainer = await createTrainerUserAndToken(firebase);
      const response = await request(app.getHttpServer())
        .patch(`/institution/${institutionId}/trainer`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId: newTrainer.uid });

      expect(response.status).toBe(200);
      const institution = await db.institutions.getDoc(institutionId);
      expect(institution.trainerIds).toContain(newTrainer.uid);
      expect(institution.trainerIds).toHaveLength(2);

      await deleteUsers(firebase, [newTrainer]);
      await db.institutions.removeTrainer(institutionId, newTrainer.uid);
    });

    it('should successfully remove a trainer from the institution', async () => {
      const trainer = global.trainer;
      const response = await request(app.getHttpServer())
        .delete(`/institution/${institutionId}/trainer`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId: trainer.uid });

      expect(response.status).toBe(200);
      const institution = await db.institutions.getDoc(institutionId);
      expect(institution.trainerIds).not.toContain(trainer.uid);
      expect(institution.trainerIds).toHaveLength(0);

      await db.institutions.addTrainer(institutionId, trainer.uid);
    });

    it('should remove member from all subgroups and completed members for all components and trainings in the future', async () => {
      const membersIds = athletes.map((a) => a.uid);
      const athleteToRemove = athletes[0];

      // create 3 trainings in the future
      await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          db.trainings.addDoc(
            generateTrainingStub({
              ownerId: global.trainer.uid,
              membersIds,
              institutionId,
              date: addDays(new Date(), i + 1),
              completedMembersIds: [athleteToRemove.uid],
              components: [
                generateTrainingComponent({
                  completedMembersIds: [athleteToRemove.uid],
                  subgroups: [
                    generateSubgroup({
                      membersIds: [athleteToRemove.uid, athletes[1].uid],
                    }),
                  ],
                }),
              ],
            }),
          ),
        ),
      );

      let trainings = await db.trainings.getDocs();
      expect(trainings).toHaveLength(3);

      for (const training of trainings) {
        expect(training.membersIds).toHaveLength(3);
        expect(training.completedMembersIds).toHaveLength(1);
        expect(training.completedMembersIds).toContain(athleteToRemove.uid);
        expect(training.components).toHaveLength(1);
        expect(training.components[0].completedMembersIds).toContain(
          athleteToRemove.uid,
        );

        expect(training.components[0].subgroups).toHaveLength(1);
        expect(training.components[0].subgroups[0].membersIds).toContain(
          athleteToRemove.uid,
        );
      }

      const response1 = await request(app.getHttpServer())
        .delete(`/institution/${institutionId}/athlete`)
        .set('Authorization', `Bearer ${global.manager.token}`)
        .send({ userId: athleteToRemove.uid });

      expect(response1.status).toBe(200);

      trainings = await db.trainings.getDocs();
      expect(trainings).toHaveLength(3);

      for (const training of trainings) {
        expect(training.membersIds).toHaveLength(2);
        expect(training.completedMembersIds).toHaveLength(0);
        expect(training.components).toHaveLength(1);
        expect(training.components[0].completedMembersIds).toHaveLength(0);

        expect(training.components[0].subgroups).toHaveLength(1);
        expect(training.components[0].subgroups[0].membersIds).toHaveLength(1);
        expect(training.components[0].subgroups[0].membersIds).not.toContain(
          athleteToRemove.uid,
        );
      }
    });
  });
});
