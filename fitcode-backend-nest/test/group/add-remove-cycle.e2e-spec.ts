import { TestApp } from '@test/common/utils/app.util';
import { addMonths } from 'date-fns';

import type { TestInstitution } from '@src/common/type/entity.type';
import { generateCycleStub } from '@src/institution/mock/cycle.stub';
import { generateGroupStub } from '@src/institution/mock/group.stub';
import { TestDbService } from '@src/test-db/test-db.service';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Add / Remove Group Cycle (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let groupId: string;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institution = await db.institutions.createTest();
    groupId = await db.groups.save(
      generateGroupStub({
        institutionId: institution.id,
        cycles: [generateCycleStub({ id: 'existing-cycle-id' })],
      }),
    );
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  describe('Add Cycle', () => {
    it.each([
      ['admin', global.admin.token],
      ['athlete', global.athlete.token],
    ])('should fail if user is %s', async (_, token) => {
      const response = await testApp.http.post(
        `/institution/${institution.id}/group/${groupId}/cycle`,
        token,
      );

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden resource');
    });

    it('should fail if user cannot edit group', async () => {
      const otherTrainer = await testApp.auth.createTrainer();
      const response = await testApp.http.post(
        `/institution/${institution.id}/group/${groupId}/cycle`,
        otherTrainer.token,
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You cannot view this institution');

      await testApp.auth.deleteUsers([otherTrainer.uid]);
    });

    it('should fail if cycle already exists in group', async () => {
      const cycleId = 'existing-cycle-id';
      const response = await testApp.http.post(
        `/institution/${institution.id}/group/${groupId}/cycle`,
        global.trainer.token,
        generateCycleStub({ id: cycleId }),
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cycle already exists in the group');
    });

    it('should fail if cycle overlaps with existing cycles', async () => {
      const overlappingCycle = generateCycleStub({
        from: new Date(),
        to: new Date(),
      });

      const response = await testApp.http.post(
        `/institution/${institution.id}/group/${groupId}/cycle`,
        global.trainer.token,
        overlappingCycle,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Cycle overlaps with existing cycles in the group',
      );
    });

    it('should successfully add cycle to group', async () => {
      const newCycle = generateCycleStub({
        name: 'New Cycle',
        from: addMonths(new Date(), 1),
        to: addMonths(new Date(), 2),
      });

      const response = await testApp.http.post(
        `/institution/${institution.id}/group/${groupId}/cycle`,
        global.trainer.token,
        newCycle,
      );

      expect(response.status).toBe(201);

      const group = await db.groups.findById({
        institutionId: institution.id,
        groupId,
      });

      expect(group.cycles.length).toBe(2);
      expect(group.cycles[1].name).toBe(newCycle.name);

      // delete the added cycle for further tests
      await db.groups.update(
        { institutionId: institution.id, groupId },
        { cycles: group.cycles.filter((cycle) => cycle.id !== newCycle.id) },
      );
    });
  });

  describe('Remove Cycle', () => {
    it.each([
      ['admin', global.admin.token],
      ['athlete', global.athlete.token],
    ])('should fail if user is %s', async (_, token) => {
      const response = await testApp.http.delete(
        `/institution/${institution.id}/group/${groupId}/cycle/existing-cycle-id`,
        token,
      );

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden resource');
    });

    it('should fail if user cannot edit group', async () => {
      const otherTrainer = await testApp.auth.createTrainer();
      const response = await testApp.http.delete(
        `/institution/${institution.id}/group/${groupId}/cycle/existing-cycle-id`,
        otherTrainer.token,
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You cannot view this institution');

      await testApp.auth.deleteUsers([otherTrainer.uid]);
    });

    it('should successfully remove cycle from group', async () => {
      const response = await testApp.http.delete(
        `/institution/${institution.id}/group/${groupId}/cycle/existing-cycle-id`,
        global.trainer.token,
      );

      expect(response.status).toBe(200);

      const group = await db.groups.findById({
        institutionId: institution.id,
        groupId,
      });

      expect(group.cycles.length).toBe(0);

      await db.groups.update(
        { institutionId: institution.id, groupId },
        { cycles: [generateCycleStub({ id: 'existing-cycle-id' })] },
      );
    });

    it('should successfully remove cycle and all trainings', async () => {
      const cycleId = 'existing-cycle-id';
      const otherGroupId = await db.groups.save(
        generateGroupStub({ institutionId: institution.id }),
      );

      // create 5 trainings for groupId and 5 for otherGroupId
      for (let i = 0; i < 10; i++)
        await db.trainings.save(
          generateTrainingStub({
            groupId: i < 5 ? groupId : otherGroupId,
            ownerId: global.trainer.uid,
            membersIds: [global.athlete.uid],
            cycleId: cycleId,
          }),
        );

      const trainings = await db.trainings.findAll();
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

      const response = await testApp.http.delete(
        `/institution/${institution.id}/group/${groupId}/cycle/${cycleId}`,
        global.trainer.token,
      );

      expect(response.status).toBe(200);

      const groups = await db.groups.getAllByInstitution({
        institutionId: institution.id,
      });

      expect(groups.length).toBe(2); // otherGroupId should still exist

      const trainingsAfterDelete = await db.trainings.findAll();
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
