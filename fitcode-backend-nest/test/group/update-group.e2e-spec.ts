import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  createGroupWithCycles,
  createInstitution,
  createInstitutionWithUsers,
  deleteDoc,
  deleteInstitution,
} from '@test/common/utils/data.util';
import { addDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { BatchUpdateOneGroupDto } from '@src/group/dto/update-group.dto';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { generateCycleStub } from '@src/group/mock/cycle.stub';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { InstitutionService } from '@src/institution/service/institution.service';

import type { TestUser } from '../common/type/auth.type';
import type { TestInstitution } from '../common/type/entity.type';

describe('Update Group (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let groupService: GroupService;
  let institutionService: InstitutionService;
  let componentService: ComponentService;

  let component: Component;
  let institution: TestInstitution;
  let group: Group;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);
    componentService = moduleFixture.get(ComponentService);

    component = await componentService.create(generateComponentStub());
    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, institution);
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'GROUP', group.id),
      deleteInstitution(firebase, institution),
      deleteDoc(firebase, 'COMPONENT', component.id),
    ]);

    await app.close();
  });

  describe('batchUpdate', () => {
    async function batchUpdateRequest(
      user: TestUser,
      input: BatchUpdateOneGroupDto[],
    ) {
      return await request(app.getHttpServer())
        .patch(`/group/update/batch`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ groups: input });
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
      const newInstitution = await createInstitutionWithUsers(
        firebase,
        institutionService,
        { additionalTrainers: [global.trainer] },
      );

      const newGroup = await createGroupWithCycles(
        groupService,
        newInstitution,
      );

      const response = await batchUpdateRequest(global.trainer, [
        group,
        newGroup,
      ]);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `You can only update groups from the same institution`,
      );

      await Promise.all([
        deleteInstitution(firebase, newInstitution),
        deleteDoc(firebase, 'GROUP', newGroup.id),
      ]);
    });

    /* it('should fail if not all users are valid', async () => {
      const response = await batchUpdateRequest(trainer, [
        { ...group, membersIds: ['invalid-member-id'] },
      ]);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Invalid members provided`);
    }); */

    it('should fail if cycles overlap', async () => {
      const response = await batchUpdateRequest(global.trainer, [
        {
          ...group,
          cycles: [
            generateCycleStub({
              from: new Date(),
              to: addDays(new Date(), 7),
            }),
            generateCycleStub({
              from: addDays(new Date(), 3),
              to: addDays(new Date(), 7),
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
        groupId: group.id,
      });

      expect(response.status).toBe(200);
      expect(found.name).toBe('new test name');
    });

    it('should successfully update complex group field types - cycles', async () => {
      const cycles = [
        generateCycleStub({
          from: addDays(new Date(), 7),
          to: addDays(new Date(), 14),
        }),
        generateCycleStub({
          from: addDays(new Date(), 1),
          to: addDays(new Date(), 6),
        }),
      ];

      const response = await batchUpdateRequest(global.trainer, [
        { ...group, cycles },
      ]);

      const found = await groupService.findOneById(global.trainer, {
        groupId: group.id,
      });

      expect(response.status).toBe(200);
      expect(found.cycles[0].id).toBe(cycles[1].id); // because of sorting, cycles must be reversed
      expect(found.cycles[1].id).toBe(cycles[0].id);

      group.cycles = cycles;
    });
  });
});
