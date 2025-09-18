import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { addDays, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { getTime } from '@src/common/service/util';
import type { TestInstitution } from '@src/common/type/entity.type';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Get Trainings (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);

    // institution with 2 trainers (one is global.trainer)
    institution = await db.institutions.createTest({
      createRandomTrainer: true,
      trainers: [global.trainer],
    });

    const trainingData = {
      institutionId: institution.id,
      ownerId: global.trainer.uid,
      membersIds: [],
    };

    const past = getTime(subDays(new Date(), 2), 8, 0);
    const today = getTime(new Date(), 8, 0);
    const future = getTime(addDays(new Date(), 1), 8, 0);

    await Promise.all([
      // past
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: past,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: past,
        }),
      ),
      // today
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: today,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: today,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[1].uid,
          date: today,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[1].uid,
          date: today,
        }),
      ),
      // future
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[1].uid,
          date: future,
        }),
      ),
      db.trainings.save(
        generateTrainingStub({
          ...trainingData,
          ownerId: institution.trainers[0].uid,
          date: future,
        }),
      ),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      db.trainings.clear(),
      db.institutions.remove(institution.id),
    ]);

    await app.close();
  });

  function req() {
    return request(app.getHttpServer())
      .get('/training/institution/today')
      .set('Authorization', `Bearer ${global.manager.token}`)
      .send();
  }

  it('should return populated trainings for today', async () => {
    const res = await req().expect(200);
    expect(res.body).toHaveLength(4); // 2 from each trainer

    for (const training of res.body as Training[])
      expect(training.institution.id).toBe(institution.id);
  });
});
