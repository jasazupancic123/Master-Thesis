import { TestApp } from '@test/common/utils/app.util';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { getTime } from '@src/common/service/util';
import type { TestUser } from '@src/common/type/entity.type';
import { TestDbService } from '@src/test-db/test-db.service';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Update Group (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institutionId: string;
  let groupId: string;
  let trainingId: string;
  let athletes: TestUser[];

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    athletes = await Promise.all([
      testApp.auth.createAthlete(),
      testApp.auth.createAthlete(),
      testApp.auth.createAthlete(),
    ]);

    const membersIds = athletes.map((a) => a.uid);
    const institution = await db.institutions.createTest({ athletes });
    const group = await db.groups.createTest(institution, { membersIds });

    institutionId = institution.id;
    groupId = group.id;
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
    await testApp.auth.deleteUsers(athletes.map((a) => a.uid));
    await db.clear();
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
      `/institution/${institutionId}/group/${groupId}/member`,
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
    const newAthlete = await testApp.auth.createAthlete();
    const response = await addMemberReq(
      trainingId,
      global.trainer.token,
      newAthlete.uid,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Member is not part of the institution');
    await testApp.auth.deleteUsers([newAthlete.uid]);
  });

  it('should successfully add a member to the training', async () => {
    const newAthlete = await testApp.auth.createAthlete();
    await db.institutions.members.addMember(
      { role: UserRole.ATHLETE },
      { institutionId, uid: newAthlete.uid },
    );

    const response = await addMemberReq(
      trainingId,
      global.trainer.token,
      newAthlete.uid,
    );

    expect(response.status).toBe(200);

    const training = await db.trainings.findById(trainingId);
    expect(training.membersIds).toHaveLength(4);
    expect(training.membersIds).toContain(newAthlete.uid);

    await testApp.auth.deleteUsers([newAthlete.uid]);
    await db.trainings.update(trainingId, {
      membersIds: athletes.map((a) => a.uid),
    });
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
    await db.trainings.update(trainingId, {
      membersIds: athletes.map((a) => a.uid),
    });
  });
});
