import { TestApp } from '@test/common/utils/app.util';
import { addDays, subDays } from 'date-fns';
import { stringify } from 'qs';

import { getTime } from '@src/common/service/util';
import type { TestInstitution, TestUser } from '@src/common/type/entity.type';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { FilterTrainingQueryDto } from '@src/training/dto/filter-training-query.dto';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Get Trainings (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;

  let trainer1: TestUser;
  let trainer2: TestUser;
  let athlete1: TestUser;
  let athlete2: TestUser;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);

    trainer1 = global.trainer;
    trainer2 = await testApp.auth.createTrainer();
    athlete1 = global.athlete;
    athlete2 = await testApp.auth.createAthlete();

    // create 7 trainings for global trainer with global athlete and test-athlete and 2 trainings for test-trainer
    const d = new Date();
    await Promise.all([
      // trainer1 trainings
      // past
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer1.uid,
          membersIds: [athlete1.uid, athlete2.uid],
          institutionId: institution.id,
          groupId: group.id,
          cycleId: '1',
          from: getTime(subDays(d, 2), 8, 0),
          to: getTime(subDays(d, 2), 9, 0),
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer1.uid,
          membersIds: [athlete1.uid],
          institutionId: institution.id,
          groupId: group.id,
          cycleId: '1',
          from: getTime(subDays(d, 1), 8, 0),
          to: getTime(subDays(d, 1), 9, 0),
        }),
      ),
      // today
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer1.uid,
          membersIds: [athlete1.uid, athlete2.uid],
          institutionId: institution.id,
          groupId: group.id,
          cycleId: '2',
          from: getTime(d, 8, 0),
          to: getTime(d, 9, 0),
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer1.uid,
          membersIds: [athlete1.uid],
          institutionId: institution.id,
          groupId: 'test-group',
          cycleId: '2',
          from: getTime(d, 13, 0),
          to: getTime(d, 14, 0),
        }),
      ),
      // future
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer1.uid,
          membersIds: [athlete1.uid, athlete2.uid],
          institutionId: institution.id,
          groupId: 'test-group',
          cycleId: '3',
          from: getTime(addDays(d, 1), 8, 0),
          to: getTime(addDays(d, 1), 9, 0),
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer1.uid,
          membersIds: [athlete1.uid],
          institutionId: institution.id,
          groupId: 'test-group',
          cycleId: '3',
          from: getTime(addDays(d, 1), 10, 0),
          to: getTime(addDays(d, 1), 11, 0),
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer1.uid,
          membersIds: [athlete1.uid, athlete2.uid],
          institutionId: institution.id,
          groupId: 'test-group',
          cycleId: '3',
          from: getTime(addDays(d, 2), 18, 0),
          to: getTime(addDays(d, 2), 19, 0),
        }),
      ),
      // trainer2 trainings
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer2.uid,
          membersIds: [athlete2.uid],
          institutionId: institution.id,
          groupId: group.id,
          cycleId: '1',
          from: getTime(subDays(d, 2), 10, 0),
          to: getTime(subDays(d, 2), 11, 0),
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ownerId: trainer2.uid,
          membersIds: [athlete2.uid],
          institutionId: institution.id,
          groupId: group.id,
          cycleId: '2',
          from: getTime(d, 15, 0),
          to: getTime(d, 16, 0),
        }),
      ),
    ]);
  });

  afterAll(async () => {
    await testApp.auth.deleteUsers([trainer2.uid, athlete2.uid]);
    await db.clear();
    await testApp.close();
  });

  function url(query: FilterTrainingQueryDto = {}) {
    const q = stringify(query, {
      addQueryPrefix: true,
      skipNulls: true,
    });

    return `/training${q}`;
  }

  async function req(query: FilterTrainingQueryDto, token: string) {
    return testApp.http.get(
      url({ institutionId: institution.id, ...query }),
      token,
    );
  }

  it('should return all trainings by trainer', async () => {
    const response1 = await req({}, trainer1.token);
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(9);

    const response2 = await req({}, trainer2.token);
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(9);
  });

  it('should return trainings by athlete', async () => {
    const response1 = await req({}, athlete1.token);
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(7);

    const response2 = await req({}, athlete2.token);
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(6);
  });

  it('should return all trainings by manager', async () => {
    const response = await req({}, global.manager.token);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(9);
  });

  it('should filter by group', async () => {
    const response1 = await req({}, trainer1.token);
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(9);

    const response2 = await req({ groupId: 'test-group' }, trainer1.token);
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(4);
  });

  it('should filter by date range', async () => {
    const today = new Date();

    // from today 00:00 to today 23:59
    const response1 = await req(
      {
        from: getTime(today, 0, 0),
        to: getTime(today, 23, 59),
        groupId: group.id,
      },
      trainer1.token,
    );

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    const response2 = await req(
      {
        from: getTime(subDays(today, 1), 0, 0), // yesterday, 00:00
        to: getTime(addDays(today, 1), 23, 59), // tomorrow, 23:59
        groupId: group.id,
      },
      trainer1.token,
    );

    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(3);
  });

  it('should filter by only start date range', async () => {
    const today = new Date();
    const response1 = await req({ from: getTime(today, 0, 0) }, trainer1.token);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(6);
  });

  it('should filter by only end date range', async () => {
    const today = new Date();
    const response1 = await req({ to: getTime(today, 23, 59) }, trainer1.token);

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(6);
  });

  it('should filter by multiple properties', async () => {
    // 1. filter by trainer1 and group1 with from date being today 00:00
    const today = new Date();
    const response1 = await req(
      { groupId: group.id, from: getTime(today, 0, 0) },
      trainer1.token,
    );

    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);
  });
});
