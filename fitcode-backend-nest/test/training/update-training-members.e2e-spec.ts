import { TestApp } from '@test/common/utils/app.util';

import { getTime } from '@src/common/service/util';
import type { TestUser } from '@src/common/type/entity.type';
import { createAthleteUserAndToken } from '@src/common/utils/auth.util';
import { deleteUsers } from '@src/common/utils/data.util';
import { FirebaseService } from '@src/firebase/firebase.service';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { TestDbService } from '@src/test-db/test-db.service';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Update Group (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let firebase: FirebaseService;

  let institutionId: string;
  let groupId: string;
  let trainingId: string;
  let athletes: TestUser[];

  beforeAll(async () => {
    testApp = await TestApp.init();
    firebase = testApp.module.get(FirebaseService);
    db = testApp.module.get(TestDbService);

    athletes = await Promise.all([
      createAthleteUserAndToken(firebase),
      createAthleteUserAndToken(firebase),
      createAthleteUserAndToken(firebase),
    ]);

    const membersIds = athletes.map((a) => a.uid);
    institutionId = await db.institutions.save(
      generateInstitutionStub({ athleteIds: membersIds }),
    );

    groupId = await db.groups.save(
      generateGroupStub({
        institutionId,
        ownerId: global.trainer.uid,
        membersIds,
      }),
    );

    trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds,
        groupId,
        institutionId,
        date: getTime(new Date(), 8, 0),
      }),
    );
  });

  afterAll(async () => {
    await deleteUsers(firebase, athletes);
    await db.cleanup();
    await testApp.close();
  });

  async function addMemberReq(
    trainingId: string,
    token: string,
    userId: string,
  ) {
    return await testApp.http.patch(`/training/${trainingId}/member`, token, {
      userId,
    });
  }

  async function removeMemberReq(
    trainingId: string,
    token: string,
    userId: string,
  ) {
    return await testApp.http.delete(`/training/${trainingId}/member`, token, {
      userId,
    });
  }

  it('should fail if training does not exist', async () => {
    const nonExistentTrainingId = 'non-existent-id';
    const response = await addMemberReq(
      nonExistentTrainingId,
      global.trainer.token,
      'userId',
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Training not found');
  });

  it('should fail if user does not have permission to update training members', async () => {
    const response = await addMemberReq(
      trainingId,
      athletes[0].token,
      athletes[1].uid,
    );
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden resource');
  });

  it('should fail if member does not exist', async () => {
    const response = await addMemberReq(
      trainingId,
      global.trainer.token,
      'non-existent-user-id',
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member does not exist');
  });

  it('should fail if member is not an athlete', async () => {
    const response = await testApp.http.patch(
      `/group/${groupId}/member`,
      global.trainer.token,
      { userId: global.manager.uid },
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member must be an athlete');
  });

  it('should fail if member is already in the training', async () => {
    const response = await addMemberReq(
      trainingId,
      global.trainer.token,
      athletes[0].uid,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member is already in the training');
  });

  it('should fail if member is not part of the institution', async () => {
    const newAthlete = await createAthleteUserAndToken(firebase);
    const response = await addMemberReq(
      trainingId,
      global.trainer.token,
      newAthlete.uid,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member is not part of the institution');
    await deleteUsers(firebase, [newAthlete]);
  });

  it('should successfully add a member to the training', async () => {
    db.checkpoint();

    const newAthlete = await createAthleteUserAndToken(firebase);
    await db.institutions.addAthlete(institutionId, newAthlete.uid);

    const response = await addMemberReq(
      trainingId,
      global.trainer.token,
      newAthlete.uid,
    );

    expect(response.status).toBe(200);

    const training = await db.trainings.findById(trainingId);
    expect(training.membersIds).toHaveLength(4);
    expect(training.membersIds).toContain(newAthlete.uid);

    await deleteUsers(firebase, [newAthlete]);
    await db.checkpointRestore();
  });

  it('should successfully remove a member from the training', async () => {
    const response = await removeMemberReq(
      trainingId,
      global.trainer.token,
      athletes[0].uid,
    );

    expect(response.status).toBe(200);

    const training = await db.trainings.findById(trainingId);
    expect(training.membersIds).toHaveLength(2);
    expect(training.membersIds).not.toContain(athletes[0].uid);
    expect(training.membersIds).toContain(athletes[1].uid);

    // Clean up by adding the athlete back
    await db.checkpointRestore();
  });
});
