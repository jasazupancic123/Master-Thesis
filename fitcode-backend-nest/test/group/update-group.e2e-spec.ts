import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { GroupService } from '../../src/group/group.service';
import { Group } from '../../src/group/entity/group.entity';
import { InstitutionService } from '../../src/institution/service/institution.service';
import {
  createGroupWithCycles,
  createInstitution,
  createInstitutionWithUsers,
  createTraining,
  deleteDoc,
  deleteDocs,
  deleteInstitution,
  deleteUsers,
} from '../common/utils/data.util';
import { createAthleteUserAndToken } from '../common/utils/auth.util';
import { TestUser } from '../common/type/auth.type';
import { BatchUpdateOneGroupDto } from '../../src/group/dto/update-group.dto';
import { generateGroupStub } from '../../src/group/mock/group.stub';
import { TestInstitution } from '../common/type/entity.type';
import { generateCycleStub } from '../../src/group/mock/cycle.stub';
import { addDays, subDays } from 'date-fns';
import { TrainingService } from '../../src/training/service/training.service';
import { Component } from '../../src/component/entity/component.entity';
import { ComponentService } from '../../src/component/component.service';
import { generateComponentStub } from '../../src/component/mock/component.stub';

describe('Update Group (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let groupService: GroupService;
  let institutionService: InstitutionService;
  let trainingService: TrainingService;
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
    trainingService = moduleFixture.get(TrainingService);
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
      const response = await batchUpdateRequest(trainer, []);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Do not provide an empty array of groups',
      );
    });

    it('should fail if invalid groups are passed in', async () => {
      const response = await batchUpdateRequest(trainer, [
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
        { additionalTrainers: [trainer] },
      );

      const newGroup = await createGroupWithCycles(
        groupService,
        newInstitution,
      );

      const response = await batchUpdateRequest(trainer, [group, newGroup]);
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
      const response = await batchUpdateRequest(trainer, [
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

    it('should fail if members are not in same institution', async () => {
      const member = await createAthleteUserAndToken(firebase);
      const response = await batchUpdateRequest(trainer, [
        { ...group, membersIds: [...group.membersIds, member.uid] },
      ]);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `User ${member.displayName || member.email} is not part of the institution and cannot be added`,
      );

      await deleteUsers(firebase, [member]);
    });

    it('should successfully update primitive group field types', async () => {
      const response = await batchUpdateRequest(trainer, [
        { ...group, name: 'new test name' },
      ]);

      const found = await groupService.findOneById(trainer, {
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

      const response = await batchUpdateRequest(trainer, [
        { ...group, cycles },
      ]);

      const found = await groupService.findOneById(trainer, {
        groupId: group.id,
      });

      expect(response.status).toBe(200);
      expect(found.cycles[0].id).toBe(cycles[1].id); // because of sorting, cycles must be reversed
      expect(found.cycles[1].id).toBe(cycles[0].id);

      group.cycles = cycles;
    });

    it('should successfully update complex group field types - members', async () => {
      const newAthlete = await createAthleteUserAndToken(firebase);
      await institutionService.updateMembers(
        manager,
        { institutionId: institution.id },
        {
          add: true,
          memberIds: [newAthlete.uid],
          trainers: false,
        },
      );

      const trainingIds = (
        await Promise.all([
          // past trainings
          createTraining(firebase, { group, from: subDays(new Date(), 1) }),
          createTraining(firebase, { group, from: subDays(new Date(), 2) }),
          createTraining(firebase, { group, from: subDays(new Date(), 3) }),
          // future trainings
          createTraining(firebase, { group, from: addDays(new Date(), 1) }),
          createTraining(firebase, { group, from: addDays(new Date(), 2) }),
          createTraining(firebase, { group, from: addDays(new Date(), 3) }),
        ])
      ).map((t) => t.id);

      const foundTrainingsBefore = await trainingService.findAll(trainer);
      expect(foundTrainingsBefore).toHaveLength(6);
      for (const t of foundTrainingsBefore) {
        expect(t.membersIds).toHaveLength(1);
        expect(t.membersIds[0]).toBe(athlete.uid);
      }

      const response = await batchUpdateRequest(institution.trainers[0], [
        { ...group, membersIds: [...institution.athleteIds, newAthlete.uid] },
      ]);

      const foundGroup = await groupService.findOneById(trainer, {
        groupId: group.id,
      });

      const foundTrainingsAfter = await trainingService.findAll(trainer);
      expect(foundTrainingsAfter).toHaveLength(6);

      const past = foundTrainingsAfter.slice(0, 3);
      const future = foundTrainingsAfter.slice(3, 6);

      // trainings before should have only one member
      for (const t of past) {
        expect(t.membersIds).toHaveLength(1);
        expect(t.membersIds).toEqual([athlete.uid]);
      }

      for (const t of future) {
        expect(t.membersIds).toHaveLength(2);
        expect(t.membersIds).toEqual([athlete.uid, newAthlete.uid]);
      }

      expect(response.status).toBe(200);
      expect(foundGroup.membersIds).toHaveLength(2);
      expect(foundGroup.membersIds).toEqual([athlete.uid, newAthlete.uid]);

      await deleteDocs(firebase, 'TRAINING', trainingIds);
      await deleteUsers(firebase, [newAthlete]);
    });
  });
});
