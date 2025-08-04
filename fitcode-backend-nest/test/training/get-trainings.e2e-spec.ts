import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TestUser } from '@test/common/type/auth.type';
import {
  createAthleteUserAndToken,
  createTrainerUserAndToken,
} from '@test/common/utils/auth.util';
import {
  createGroupWithCycles,
  createInstitution,
  deleteDoc,
} from '@test/common/utils/data.util';
import { addDays, subDays } from 'date-fns';
import { stringify } from 'qs';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { getTime } from '@src/common/service/util';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { TestDbService } from '@src/test-db/test-db.service';
import type { FilterTrainingQueryDto } from '@src/training/dto/filter-training-query.dto';
import type { Training } from '@src/training/entity/training.entity';

import type { TestInstitution } from '../common/type/entity.type';

describe('Get Trainings (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let db: TestDbService;
  let componentService: ComponentService;
  let institutionService: InstitutionService;
  let groupService: GroupService;

  let institution: TestInstitution;
  let group: Group;
  let component: Component;

  let trainer1: TestUser;
  let trainer2: TestUser;
  let athlete1: TestUser;
  let athlete2: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);

    component = await componentService.create(generateComponentStub());
    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, institution);

    trainer1 = global.trainer;
    trainer2 = await createTrainerUserAndToken(firebase);
    athlete1 = global.athlete;
    athlete2 = await createAthleteUserAndToken(firebase);

    // create 7 trainings for global trainer with global athlete and test-athlete and 2 trainings for test-trainer
    const d = new Date();
    await Promise.all([
      // trainer1 trainings
      // past
      db.trainings.create({
        ownerId: trainer1.uid,
        membersIds: [athlete1.uid, athlete2.uid],
        institutionId: institution.id,
        groupId: group.id,
        cycleId: '1',
        from: getTime(subDays(d, 2), 8, 0),
        to: getTime(subDays(d, 2), 9, 0),
      }),
      db.trainings.create({
        ownerId: trainer1.uid,
        membersIds: [athlete1.uid],
        institutionId: institution.id,
        groupId: group.id,
        cycleId: '1',
        from: getTime(subDays(d, 1), 8, 0),
        to: getTime(subDays(d, 1), 9, 0),
      }),
      // today
      db.trainings.create({
        ownerId: trainer1.uid,
        membersIds: [athlete1.uid, athlete2.uid],
        institutionId: institution.id,
        groupId: group.id,
        cycleId: '2',
        from: getTime(d, 8, 0),
        to: getTime(d, 9, 0),
      }),
      db.trainings.create({
        ownerId: trainer1.uid,
        membersIds: [athlete1.uid],
        institutionId: institution.id,
        groupId: 'test-group',
        cycleId: '2',
        from: getTime(d, 13, 0),
        to: getTime(d, 14, 0),
      }),
      // future
      db.trainings.create({
        ownerId: trainer1.uid,
        membersIds: [athlete1.uid, athlete2.uid],
        institutionId: institution.id,
        groupId: 'test-group',
        cycleId: '3',
        from: getTime(addDays(d, 1), 8, 0),
        to: getTime(addDays(d, 1), 9, 0),
      }),
      db.trainings.create({
        ownerId: trainer1.uid,
        membersIds: [athlete1.uid],
        institutionId: institution.id,
        groupId: 'test-group',
        cycleId: '3',
        from: getTime(addDays(d, 1), 10, 0),
        to: getTime(addDays(d, 1), 11, 0),
      }),
      db.trainings.create({
        ownerId: trainer1.uid,
        membersIds: [athlete1.uid, athlete2.uid],
        institutionId: institution.id,
        groupId: 'test-group',
        cycleId: '3',
        from: getTime(addDays(d, 2), 18, 0),
        to: getTime(addDays(d, 2), 19, 0),
      }),
      // trainer2 trainings
      db.trainings.create({
        ownerId: trainer2.uid,
        membersIds: [athlete2.uid],
        institutionId: institution.id,
        groupId: group.id,
        cycleId: '1',
        from: getTime(subDays(d, 2), 10, 0),
        to: getTime(subDays(d, 2), 11, 0),
      }),
      db.trainings.create({
        ownerId: trainer2.uid,
        membersIds: [athlete2.uid],
        institutionId: institution.id,
        groupId: group.id,
        cycleId: '2',
        from: getTime(d, 15, 0),
        to: getTime(d, 16, 0),
      }),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      db.trainings.delete(),
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'COMPONENT', component.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
    ]);

    await app.close();
  });

  function url(query: FilterTrainingQueryDto = {}) {
    const q = stringify(query, {
      addQueryPrefix: true,
      skipNulls: true,
    });

    return `/training${q}`;
  }

  it('should return all trainings by trainer', async () => {
    const response1 = await request(app.getHttpServer())
      .get(url())
      .set('Authorization', `Bearer ${trainer1.token}`);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(7);

    const response2 = await request(app.getHttpServer())
      .get(url())
      .set('Authorization', `Bearer ${trainer2.token}`);

    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(2);
  });

  it('should return trainings by athlete', async () => {
    const response1 = await request(app.getHttpServer())
      .get(url())
      .set('Authorization', `Bearer ${athlete1.token}`);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(7);

    const response2 = await request(app.getHttpServer())
      .get(url())
      .set('Authorization', `Bearer ${athlete2.token}`);

    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(6);
  });

  it('should filter by group', async () => {
    const response1 = await request(app.getHttpServer())
      .get(url({ groupId: group.id }))
      .set('Authorization', `Bearer ${trainer1.token}`);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(3);

    const response2 = await request(app.getHttpServer())
      .get(url({ groupId: 'test-group' }))
      .set('Authorization', `Bearer ${trainer1.token}`);

    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(4);
  });

  it('should filter by cycle', async () => {
    const response1 = await request(app.getHttpServer())
      .get(url({ cycleId: '1' }))
      .set('Authorization', `Bearer ${trainer1.token}`);
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    const training1 = response1.body[0] as Training;
    const training2 = response1.body[1] as Training;
    expect(training1.groupId).toBe(group.id);
    expect(training2.groupId).toBe(group.id);
    expect(training1.cycleId).toBe('1');
    expect(training2.cycleId).toBe('1');

    const response2 = await request(app.getHttpServer())
      .get(url({ cycleId: '2' }))
      .set('Authorization', `Bearer ${trainer1.token}`);
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(2);

    const training3 = response2.body[0] as Training;
    const training4 = response2.body[1] as Training;
    expect(training3.groupId).toBe(group.id);
    expect(training4.groupId).toBe('test-group');
    expect(training3.cycleId).toBe('2');
    expect(training4.cycleId).toBe('2');

    const response3 = await request(app.getHttpServer())
      .get(url({ cycleId: '3' }))
      .set('Authorization', `Bearer ${trainer1.token}`);
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(3);

    const training5 = response3.body[0] as Training;
    const training6 = response3.body[1] as Training;
    const training7 = response3.body[2] as Training;
    expect(training5.groupId).toBe('test-group');
    expect(training6.groupId).toBe('test-group');
    expect(training7.groupId).toBe('test-group');
    expect(training5.cycleId).toBe('3');
    expect(training6.cycleId).toBe('3');
    expect(training7.cycleId).toBe('3');
  });

  it('should filter by date range', async () => {
    const today = new Date();
    const response1 = await request(app.getHttpServer())
      // from today 00:00 to today 23:59
      .get(url({ from: getTime(today, 0, 0), to: getTime(today, 23, 59) }))
      .set('Authorization', `Bearer ${trainer1.token}`);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    const response2 = await request(app.getHttpServer())
      .get(
        url({
          from: getTime(subDays(today, 1), 0, 0), // yesterday, 00:00
          to: getTime(addDays(today, 1), 23, 59), // tomorrow, 23:59
        }),
      )
      .set('Authorization', `Bearer ${trainer1.token}`);

    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(5);
  });

  it('should filter by only start date range', async () => {
    const today = new Date();
    const response1 = await request(app.getHttpServer())
      .get(url({ from: getTime(today, 0, 0) }))
      .set('Authorization', `Bearer ${trainer1.token}`);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(5);
  });

  it('should filter by only end date range', async () => {
    const today = new Date();
    const response1 = await request(app.getHttpServer())
      .get(url({ to: getTime(today, 23, 59) }))
      .set('Authorization', `Bearer ${trainer1.token}`);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(4);
  });

  it('should filter by multiple properties', async () => {
    // 1. filter by trainer1 and group1 with from date being today 00:00
    const today = new Date();
    const response1 = await request(app.getHttpServer())
      .get(url({ groupId: group.id, from: getTime(today, 0, 0) }))
      .set('Authorization', `Bearer ${trainer1.token}`);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(1);

    // 2. filter by athlete2 and cycle 1 with to date being today 23:59
    const response2 = await request(app.getHttpServer())
      .get(url({ cycleId: '1', to: getTime(today, 23, 59) }))
      .set('Authorization', `Bearer ${athlete2.token}`);

    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(2);
  });
});
