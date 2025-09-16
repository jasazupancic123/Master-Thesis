import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { addDays, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import type { DateRangeDto } from '@src/common/dto/date-range.dto';
import { getTime } from '@src/common/service/util';
import type { TestInstitution } from '@src/common/type/entity.type';
import type { Component } from '@src/component/entity/component.entity';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import {
  generateTrainingComponent,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

describe('Update Training (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let component: Component;
  let institution: TestInstitution;
  let group: Group;
  let trainingId: string;

  let trainingDate = getTime(addDays(new Date(), 2), 8, 0); // 2 days in the future, 8:00 AM

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);

    component = await db.components.create();
    institution = await db.institutions.create();
    group = await db.groups.createTest(institution);
    trainingId = await db.trainings.save(
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        ownerId: institution.trainerIds[0],
        membersIds: [],
        from: trainingDate,
        components: [generateTrainingComponent({ id: component.id })],
      }),
    );
  });

  afterAll(async () => {
    await db.institutions.remove(institution.id);
    await db.groups.delete(group.id);
    await db.trainings.delete(trainingId);
    await db.components.delete(component.id);
    await app.close();
  });

  async function req(
    trainingId: string,
    body: DateRangeDto,
    token: string = global.trainer.token,
  ) {
    return await request(app.getHttpServer())
      .patch(`/training/${trainingId}/component/${component.id}/time`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  it('should fail to update training if training is in the past', async () => {
    const pastTrainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [],
        from: subDays(getTime(new Date(), 8, 0), 1),
        to: subDays(getTime(new Date(), 9, 0), 1),
        components: [generateTrainingComponent({ id: component.id })],
      }),
    );

    const response = await req(pastTrainingId, {
      from: new Date(),
      to: new Date(),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'You cannot add or update trainings in the past',
    );

    await db.trainings.delete(pastTrainingId);
  });

  it('should fail if input dates are not on the same day as training', async () => {});

  it('should fail if input period is different than training period', async () => {});

  it('should fail to update training if there is overlap between trainings', async () => {
    const in3Days = addDays(new Date(), 3);

    const prevTrainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [],
        groupId: group.id,
        cycleId: group.cycles[0].id,
        from: getTime(in3Days, 9, 30),
        to: getTime(in3Days, 10, 30),
        components: [generateTrainingComponent({ id: component.id })],
      }),
    );

    const newTrainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [],
        groupId: group.id,
        cycleId: group.cycles[0].id,
        from: getTime(in3Days, 11, 0),
        to: getTime(in3Days, 12, 0),
        components: [generateTrainingComponent({ id: component.id })],
      }),
    );

    const response = await req(newTrainingId, {
      from: getTime(in3Days, 10, 0),
      to: getTime(in3Days, 11, 0),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Training overlaps with other training');

    await db.trainings.delete(prevTrainingId);
    await db.trainings.delete(newTrainingId);
  });
});
