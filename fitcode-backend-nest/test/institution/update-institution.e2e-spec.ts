import { TestApp } from '@test/common/utils/app.util';
import { addDays, isAfter, isBefore, startOfDay, subDays } from 'date-fns';

import { UserRole } from '@src/auth/enum/user-role.enum';
import type { TestUser } from '@src/common/type/entity.type';
import { GroupService } from '@src/group/group.service';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { TestDbService } from '@src/test-db/test-db.service';
import {
  generateSubgroup,
  generateTrainingComponent,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';

describe('Update Institution (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let groupService: GroupService;
  let trainingService: TrainingService;

  let institutionId: string;
  let athletes: TestUser[];

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    groupService = testApp.module.get(GroupService);
    trainingService = testApp.module.get(TrainingService);

    const institution = await db.institutions.createTest();
    institutionId = institution.id;
    athletes = await Promise.all([
      testApp.auth.createAthlete(),
      testApp.auth.createAthlete(),
      testApp.auth.createAthlete(),
    ]);
  });

  afterAll(async () => {
    await testApp.auth.deleteUsers(athletes.map((a) => a.uid));
    await db.clear();
    await testApp.close();
  });

  async function addAthleteReq(
    institutionId: string,
    token: string,
    userId: string,
  ) {
    return await testApp.http.patch(
      `/institution/${institutionId}/athlete`,
      token,
      { userId },
    );
  }

  async function addTrainerReq(
    institutionId: string,
    token: string,
    userId: string,
  ) {
    return await testApp.http.patch(
      `/institution/${institutionId}/trainer`,
      token,
      { userId },
    );
  }

  async function deleteAthleteReq(
    institutionId: string,
    token: string,
    userId: string,
  ) {
    return await testApp.http.delete(
      `/institution/${institutionId}/athlete`,
      token,
      { userId },
    );
  }

  async function deleteTrainerReq(
    institutionId: string,
    token: string,
    userId: string,
  ) {
    return await testApp.http.delete(
      `/institution/${institutionId}/trainer`,
      token,
      { userId },
    );
  }

  describe('Update Members', () => {
    it('should fail if institution does not exist', async () => {
      const nonExistentInstitutionId = 'non-existent-id';
      const response = await addAthleteReq(
        nonExistentInstitutionId,
        global.manager.token,
        'userId',
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Institution not found');
    });

    it('should fail if user is not authorized', async () => {
      const otherManager = await testApp.auth.createManager();
      const response = await addAthleteReq(
        institutionId,
        otherManager.token,
        'userId',
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You cannot edit this institution');

      await testApp.auth.deleteUsers([otherManager.uid]);
    });

    it('should fail if user does not exist', async () => {
      const response = await addAthleteReq(
        institutionId,
        global.manager.token,
        'non-existent-user-id',
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Member does not exist');
    });

    it('should successfully add an athlete to the institution', async () => {
      const userId = athletes[0].uid;
      const response = await addAthleteReq(
        institutionId,
        global.manager.token,
        userId,
      );

      expect(response.status).toBe(200);

      const institution = await db.institutions.findById(institutionId);
      expect(institution.athleteIds).toHaveLength(2);
      expect(institution.athleteIds).toContain(userId);
    });

    it('should successfully add an athlete to the institution but not its groups and trainings', async () => {
      const membersIds = [athletes[0], athletes[1]].map((a) => a.uid); // only the first two athletes
      const newAthlete = athletes[2];

      const existingGroups = await Promise.all([
        db.groups.save(generateGroupStub({ institutionId, membersIds })),
        db.groups.save(generateGroupStub({ institutionId, membersIds })),
        db.groups.save(generateGroupStub({ institutionId, membersIds })),
      ]);

      const training = {
        ownerId: global.trainer.uid,
        membersIds,
        institutionId,
      };

      // 2 past and 3 future trainings
      await Promise.all([
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[0],
            date: subDays(new Date(), 3),
          }),
        ),
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[0],
            date: subDays(new Date(), 2),
          }),
        ),
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[1],
            date: new Date(),
          }),
        ),
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[1],
            date: new Date(),
          }),
        ),
        db.trainings.save(
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

      const response = await addAthleteReq(
        institutionId,
        global.manager.token,
        newAthlete.uid,
      );

      expect(response.status).toBe(200);

      const institution = await db.institutions.findById(institutionId);
      expect(institution.athleteIds).toHaveLength(3);
      expect(institution.athleteIds).toContain(newAthlete.uid);

      for (const serviceSpy of [groupServiceSpy, trainingServiceSpy]) {
        expect(serviceSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({
            institutionId,
            userId: newAthlete.uid,
            add: true,
          }),
        );

        serviceSpy.mockClear();
      }

      const groups = await db.groups.findAll();
      expect(groups).toHaveLength(3);
      for (const group of groups) {
        expect(group.membersIds).toHaveLength(2);
        expect(group.membersIds).not.toContain(newAthlete.uid);
      }

      const trainings = await db.trainings.findAll();
      expect(trainings).toHaveLength(5);

      for (const training of trainings) {
        expect(training.membersIds).toHaveLength(2);
        expect(training.membersIds).not.toContain(newAthlete.uid);
      }

      // delete created groups and trainings
      for (const groupId of existingGroups) await db.groups.delete(groupId);
      for (const training of trainings) await db.trainings.delete(training.id);
    });

    it('should successfully remove an athlete from the institution and all groups and trainings', async () => {
      const membersIds = [athletes[0], athletes[1]].map((a) => a.uid); // only the first two athletes
      const userId = athletes[0].uid; // user to remove

      // delete institution and recreate it to reset the state
      await db.institutions.delete(institutionId);
      const institution = await db.institutions.createTest({
        athletes: [athletes[0], athletes[1]],
      });

      institutionId = institution.id;

      const existingGroups = await Promise.all([
        db.groups.save(generateGroupStub({ institutionId, membersIds })),
        db.groups.save(generateGroupStub({ institutionId, membersIds })),
        db.groups.save(generateGroupStub({ institutionId, membersIds })),
      ]);

      const training = {
        ownerId: global.trainer.uid,
        membersIds,
        institutionId,
      };

      // 2 past and 3 future trainings
      await Promise.all([
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[0],
            date: subDays(new Date(), 3),
          }),
        ),
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[0],
            date: subDays(new Date(), 3),
          }),
        ),
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[1],
            date: new Date(),
          }),
        ),
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[1],
            date: new Date(),
          }),
        ),
        db.trainings.save(
          generateTrainingStub({
            ...training,
            groupId: existingGroups[2],
            date: addDays(new Date(), 3),
          }),
        ),
      ]);

      const response = await deleteAthleteReq(
        institutionId,
        global.manager.token,
        userId,
      );

      expect(response.status).toBe(200);
      const found = await db.institutions.findById(institutionId);
      expect(found.athleteIds).toHaveLength(1);
      expect(found.athleteIds).not.toContain(userId);

      const groups = await db.groups.findAll();
      expect(groups).toHaveLength(3);
      for (const group of groups) {
        expect(group.membersIds).toHaveLength(1);
        expect(group.membersIds).not.toContain(userId);
      }

      const trainings = await db.trainings.findAll();
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

      // delete created groups and trainings
      for (const groupId of existingGroups) await db.groups.delete(groupId);
      for (const training of trainings) await db.trainings.delete(training.id);
    });

    it('should fail to add trainer if user is not a trainer', async () => {
      const nonTrainer = await testApp.auth.createAthlete();
      const response = await addTrainerReq(
        institutionId,
        global.manager.token,
        nonTrainer.uid,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Member must be a trainer to be added as a trainer',
      );

      await testApp.auth.deleteUsers([nonTrainer.uid]);
    });

    it('should successfully add a trainer to the institution', async () => {
      const newTrainer = await testApp.auth.createTrainer();
      const response = await addTrainerReq(
        institutionId,
        global.manager.token,
        newTrainer.uid,
      );

      expect(response.status).toBe(200);
      const institution = await db.institutions.findById(institutionId);
      expect(institution.trainerIds).toContain(newTrainer.uid);
      expect(institution.trainerIds).toHaveLength(2);

      await testApp.auth.deleteUsers([newTrainer.uid]);
      await db.institutions.members.removeMember({
        institutionId,
        uid: newTrainer.uid,
      });
    });

    it('should successfully remove a trainer from the institution', async () => {
      const trainer = global.trainer;
      const response = await deleteTrainerReq(
        institutionId,
        global.manager.token,
        trainer.uid,
      );

      expect(response.status).toBe(200);
      const institution = await db.institutions.findById(institutionId);
      expect(institution.trainerIds).not.toContain(trainer.uid);
      expect(institution.trainerIds).toHaveLength(0);

      await db.institutions.members.addMember(
        { role: UserRole.TRAINER },
        { institutionId, uid: trainer.uid },
      );
    });

    it('should remove member from all subgroups and completed members for all components and trainings in the future', async () => {
      const membersIds = athletes.map((a) => a.uid);
      const athleteToRemove = athletes[0];

      // create 3 trainings in the future
      await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          db.trainings.save(
            generateTrainingStub({
              ownerId: global.trainer.uid,
              membersIds,
              institutionId,
              date: addDays(new Date(), i + 1),
              components: [
                generateTrainingComponent({
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

      let trainings = await db.trainings.findAll();
      expect(trainings).toHaveLength(3);

      for (const training of trainings) {
        expect(training.membersIds).toHaveLength(3);
        expect(training.components).toHaveLength(1);
        expect(training.components[0].subgroups).toHaveLength(1);
        expect(training.components[0].subgroups[0].membersIds).toContain(
          athleteToRemove.uid,
        );
      }

      const response1 = await deleteAthleteReq(
        institutionId,
        global.manager.token,
        athleteToRemove.uid,
      );

      expect(response1.status).toBe(200);

      trainings = await db.trainings.findAll();
      expect(trainings).toHaveLength(3);

      for (const training of trainings) {
        expect(training.membersIds).toHaveLength(2);
        expect(training.components).toHaveLength(1);
        expect(training.components[0].subgroups).toHaveLength(1);
        expect(training.components[0].subgroups[0].membersIds).toHaveLength(1);
        expect(training.components[0].subgroups[0].membersIds).not.toContain(
          athleteToRemove.uid,
        );
      }
    });
  });
});
