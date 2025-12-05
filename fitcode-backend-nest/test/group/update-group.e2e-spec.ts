import { TestApp } from '@test/common/utils/app.util';
import { addDays } from 'date-fns';

import type { TestInstitution, TestUser } from '@src/common/type/entity.type';
import type { BatchUpdateOneGroupDto } from '@src/institution/dto/update-group.dto';
import type { Group } from '@src/institution/entity/group.entity';
import { generateCycleStub } from '@src/institution/mock/cycle.stub';
import { generateGroupStub } from '@src/institution/mock/group.stub';
import { GroupService } from '@src/institution/service/group.service';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Update Group (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let groupService: GroupService;

  let institution: TestInstitution;
  let group: Group;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    groupService = testApp.module.get(GroupService);

    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  describe('batchUpdate', () => {
    async function batchUpdateRequest(
      user: TestUser,
      input: BatchUpdateOneGroupDto[],
      institutionId = institution.id,
    ) {
      return await testApp.http.patch(
        `/institution/${institutionId}/group/update/batch`,
        user.token,
        { groups: input },
      );
    }

    it('should fail if empty array is passed in', async () => {
      const response = await batchUpdateRequest(global.trainer, []);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Do not provide an empty array of groups',
      );
    });

    it('should fail if invalid groups are passed in', async () => {
      const response = await batchUpdateRequest(global.trainer, [
        group,
        generateGroupStub(),
      ]);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid groups provided');
    });

    it('should fail if not all groups have the same institution', async () => {
      const newInstitution = await db.institutions.createTest({
        trainers: [global.trainer],
      });

      const newGroup = await db.groups.createTest(newInstitution);
      const response = await batchUpdateRequest(
        global.trainer,
        [group, newGroup],
        newInstitution.id,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Invalid groups provided`);

      await db.institutions.deleteTest(newInstitution.id);
      await db.groups.delete({
        institutionId: newInstitution.id,
        groupId: newGroup.id,
      });
    });

    it('should fail if cycles overlap', async () => {
      const response = await batchUpdateRequest(global.trainer, [
        {
          ...group,
          cycles: [
            generateCycleStub({
              id: group.cycles[0].id,
              from: new Date(),
              to: addDays(new Date(), 7),
            }),
            generateCycleStub({
              id: group.cycles[1].id,
              from: addDays(new Date(), 3),
              to: addDays(new Date(), 7),
            }),
            generateCycleStub({
              id: group.cycles[2].id,
              from: addDays(new Date(), 5),
              to: addDays(new Date(), 10),
            }),
          ],
        },
      ]);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Cycles in group ${group.name} cannot overlap`,
      );
    });

    it('should successfully update primitive group field types', async () => {
      const response = await batchUpdateRequest(global.trainer, [
        { ...group, name: 'new test name' },
      ]);

      const found = await groupService.findOneById(global.trainer, {
        institutionId: institution.id,
        groupId: group.id,
      });

      expect(response.status).toBe(200);
      expect(found.name).toBe('new test name');
    });

    it('should successfully update complex group field types - cycles', async () => {
      const cycles = [
        generateCycleStub({
          id: group.cycles[0].id,
          from: addDays(new Date(), 7),
          to: addDays(new Date(), 14),
        }),
        generateCycleStub({
          id: group.cycles[1].id,
          from: addDays(new Date(), 1),
          to: addDays(new Date(), 6),
        }),
        generateCycleStub({
          id: group.cycles[2].id,
          from: addDays(new Date(), 15),
          to: addDays(new Date(), 20),
        }),
      ];

      const response = await batchUpdateRequest(global.trainer, [
        { ...group, cycles },
      ]);

      const found = await groupService.findOneById(global.trainer, {
        institutionId: institution.id,
        groupId: group.id,
      });

      expect(response.status).toBe(200);
      expect(found.cycles.length).toBe(3);

      group.cycles = cycles;
    });

    it('should throw an error if all net cycles are not the same as the original group cycles', async () => {
      const cycles = [
        generateCycleStub({
          from: addDays(new Date(), 7),
          to: addDays(new Date(), 14),
        }),
      ];

      const response = await batchUpdateRequest(global.trainer, [
        { ...group, cycles },
      ]);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Cycles in group ${group.name} do not match. If you are trying to add or remove cycles, use separate route`,
      );
    });
  });
});
