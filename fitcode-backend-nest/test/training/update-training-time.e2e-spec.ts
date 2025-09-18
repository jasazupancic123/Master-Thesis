import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { expectDatesToMatchUpToMinute } from '@test/common/utils/date.util';
import { addDays, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import type { DateRangeDto } from '@src/common/dto/date-range.dto';
import { getTime } from '@src/common/service/util';
import type { TestInstitution } from '@src/common/type/entity.type';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import type { Component } from '@src/component/entity/component.entity';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import { DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN } from '@src/training/constant/training-limits.constant';
import {
  generateTrainingComponent,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

describe('Update Training (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let c1: Component;
  let c2: Component;
  let c3: Component;

  let institution: TestInstitution;
  let group: Group;
  let trainingId: string;

  const trainingDate = getTime(addDays(new Date(), 2), 8, 0); // 2 days in the future, 8:00 AM

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);

    c1 = await db.components.create();
    c2 = await db.components.create();
    c3 = await db.components.create();

    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);
    trainingId = await db.trainings.save(
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        ownerId: institution.trainerIds[0],
        membersIds: [],
        from: trainingDate,
        components: [generateTrainingComponent({ id: c1.id })],
      }),
    );
  });

  afterAll(async () => {
    await db.institutions.remove(institution.id);
    await db.groups.delete(group.id);
    await db.trainings.delete(trainingId);
    await db.components.delete(c1.id);
    await app.close();
  });

  async function req(
    body: DateRangeDto,
    _trainingId = trainingId,
    _componentId = c1.id,
    token: string = global.trainer.token,
  ) {
    return await request(app.getHttpServer())
      .patch(`/training/${_trainingId}/component/${_componentId}/time`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  it('should fail if component is invalid', async () => {
    const response = await req(
      { from: new Date(), to: new Date() },
      trainingId,
      'invalid-id',
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Training component not found');
  });

  it('should throw error if user tries to update warmup or cooldown component', async () => {
    const response = await req(
      { from: trainingDate, to: trainingDate },
      trainingId,
      'warmup',
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'You cannot update warmup and cooldown times',
    );
  });

  it('should fail to update training if training is in the past', async () => {
    const pastTrainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [],
        from: subDays(getTime(new Date(), 8, 0), 1),
        to: subDays(getTime(new Date(), 9, 0), 1),
        components: [generateTrainingComponent({ id: c1.id })],
      }),
    );

    const response = await req(
      { from: new Date(), to: new Date() },
      pastTrainingId,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'You cannot add or update trainings in the past',
    );

    await db.trainings.delete(pastTrainingId);
  });

  it('should fail if input dates are not on the same day as training', async () => {
    const response = await req({
      from: getTime(addDays(trainingDate, 1), 9, 0),
      to: getTime(addDays(trainingDate, 1), 10, 0),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Input dates must be on the same day as training',
    );
  });

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
        components: [generateTrainingComponent({ id: c1.id })],
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
        components: [generateTrainingComponent({ id: c1.id })],
      }),
    );

    const response = await req(
      { from: getTime(in3Days, 10, 0), to: getTime(in3Days, 11, 0) },
      newTrainingId,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Training overlaps with other training');

    await db.trainings.delete(prevTrainingId);
    await db.trainings.delete(newTrainingId);
  });

  it('should throw error if new `to` extends beyond next components `to`', async () => {
    const trainingDate = addDays(new Date(), 4);
    const newTrainingId = await db.trainings.save(
      generateTrainingStub(
        {
          institutionId: institution.id,
          groupId: group.id,
          cycleId: group.cycles[0].id,
          ownerId: institution.trainerIds[0],
          membersIds: [],
          from: trainingDate,
          components: [
            generateTrainingComponent({
              id: c1.id,
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: c2.id,
              from: getTime(trainingDate, 8, 30),
              to: getTime(trainingDate, 9, 0),
            }),
          ],
        },
        { disableAutomaticallySetComponentsDates: true },
      ),
    );

    const response = await req(
      { from: getTime(trainingDate, 8, 0), to: getTime(trainingDate, 9, 15) },
      newTrainingId,
      c1.id,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Cannot extend time beyond the next component',
    );

    await db.trainings.delete(newTrainingId);
  });

  it('should throw error if new `from` is before previous components `from`', async () => {
    const trainingDate = addDays(new Date(), 4);
    const newTrainingId = await db.trainings.save(
      generateTrainingStub(
        {
          institutionId: institution.id,
          groupId: group.id,
          cycleId: group.cycles[0].id,
          ownerId: institution.trainerIds[0],
          membersIds: [],
          from: trainingDate,
          components: [
            generateTrainingComponent({
              id: c1.id,
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: c2.id,
              from: getTime(trainingDate, 8, 30),
              to: getTime(trainingDate, 9, 0),
            }),
          ],
        },
        { disableAutomaticallySetComponentsDates: true },
      ),
    );

    const response = await req(
      { from: getTime(trainingDate, 7, 45), to: getTime(trainingDate, 8, 15) },
      newTrainingId,
      c2.id,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Cannot move start time before the previous component',
    );

    await db.trainings.delete(newTrainingId);
  });

  it('should successfully update first component and adjust training from and warmup', async () => {
    const trainingDate = new Date();
    const newTrainingId = await db.trainings.save(
      generateTrainingStub(
        {
          institutionId: institution.id,
          groupId: group.id,
          cycleId: group.cycles[0].id,
          ownerId: institution.trainerIds[0],
          membersIds: [],
          from: getTime(trainingDate, 8, 0),
          warmup: generateTrainingComponent({
            id: WARMUP_COMPONENT_ID,
            from: getTime(trainingDate, 7, 45),
            to: getTime(trainingDate, 8, 0),
          }),
          components: [
            generateTrainingComponent({
              id: c1.id,
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: c2.id,
              from: getTime(trainingDate, 8, 30),
              to: getTime(trainingDate, 9, 0),
            }),
          ],
          cooldown: generateTrainingComponent({
            id: COOLDOWN_COMPONENT_ID,
            from: getTime(trainingDate, 9, 0),
            to: getTime(trainingDate, 9, 15),
          }),
        },
        { disableAutomaticallySetComponentsDates: true },
      ),
    );

    const response = await req(
      { from: getTime(trainingDate, 8, 15), to: getTime(trainingDate, 8, 45) },
      newTrainingId,
      c1.id,
    );

    expect(response.status).toBe(200);
    expectDatesToMatchUpToMinute(
      new Date(response.body.from),
      getTime(
        trainingDate,
        8,
        15 - DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.warmup.from),
      getTime(
        trainingDate,
        8,
        15 - DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.warmup.to),
      getTime(trainingDate, 8, 15),
    );
    expect(response.body.components).toHaveLength(2);
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[0].from),
      getTime(trainingDate, 8, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[0].to),
      getTime(trainingDate, 8, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[1].from),
      getTime(trainingDate, 8, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[1].to),
      getTime(trainingDate, 9, 0),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.cooldown.from),
      getTime(trainingDate, 9, 0),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.cooldown.to),
      getTime(
        trainingDate,
        9,
        0 + DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
    );

    await db.trainings.delete(newTrainingId);
  });

  it('should successfully update last component and adjust training to and cooldown', async () => {
    const trainingDate = new Date();
    const newTrainingId = await db.trainings.save(
      generateTrainingStub(
        {
          institutionId: institution.id,
          groupId: group.id,
          cycleId: group.cycles[0].id,
          ownerId: institution.trainerIds[0],
          membersIds: [],
          from: getTime(trainingDate, 8, 0),
          warmup: generateTrainingComponent({
            id: WARMUP_COMPONENT_ID,
            from: getTime(trainingDate, 7, 45),
            to: getTime(trainingDate, 8, 0),
          }),
          components: [
            generateTrainingComponent({
              id: c1.id,
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: c2.id,
              from: getTime(trainingDate, 8, 30),
              to: getTime(trainingDate, 9, 0),
            }),
          ],
          cooldown: generateTrainingComponent({
            id: COOLDOWN_COMPONENT_ID,
            from: getTime(trainingDate, 9, 0),
            to: getTime(trainingDate, 9, 15),
          }),
        },
        { disableAutomaticallySetComponentsDates: true },
      ),
    );

    const response = await req(
      { from: getTime(trainingDate, 8, 15), to: getTime(trainingDate, 9, 15) },
      newTrainingId,
      c2.id,
    );

    expect(response.status).toBe(200);
    expectDatesToMatchUpToMinute(
      new Date(response.body.to),
      getTime(
        trainingDate,
        9,
        15 + DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.cooldown.from),
      getTime(trainingDate, 9, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.cooldown.to),
      getTime(
        trainingDate,
        9,
        15 + DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
    );
    expect(response.body.components).toHaveLength(2);
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[0].from),
      getTime(trainingDate, 8, 0),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[0].to),
      getTime(trainingDate, 8, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[1].from),
      getTime(trainingDate, 8, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[1].to),
      getTime(trainingDate, 9, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.warmup.from),
      getTime(
        trainingDate,
        8,
        0 - DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.warmup.to),
      getTime(trainingDate, 8, 0),
    );

    await db.trainings.delete(newTrainingId);
  });

  it('should successfully update middle component and adjust only immediate neighbors', async () => {
    const trainingDate = new Date();
    const newTrainingId = await db.trainings.save(
      generateTrainingStub(
        {
          institutionId: institution.id,
          groupId: group.id,
          cycleId: group.cycles[0].id,
          ownerId: institution.trainerIds[0],
          membersIds: [],
          from: getTime(trainingDate, 8, 0),
          warmup: generateTrainingComponent({
            id: WARMUP_COMPONENT_ID,
            from: getTime(trainingDate, 7, 45),
            to: getTime(trainingDate, 8, 0),
          }),
          components: [
            generateTrainingComponent({
              id: c1.id,
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: c2.id,
              from: getTime(trainingDate, 8, 30),
              to: getTime(trainingDate, 9, 0),
            }),
            generateTrainingComponent({
              id: c3.id,
              from: getTime(trainingDate, 9, 0),
              to: getTime(trainingDate, 9, 30),
            }),
          ],
          cooldown: generateTrainingComponent({
            id: COOLDOWN_COMPONENT_ID,
            from: getTime(trainingDate, 9, 30),
            to: getTime(trainingDate, 9, 45),
          }),
        },
        { disableAutomaticallySetComponentsDates: true },
      ),
    );

    const response = await req(
      { from: getTime(trainingDate, 8, 45), to: getTime(trainingDate, 9, 15) },
      newTrainingId,
      c2.id,
    );

    expect(response.status).toBe(200);
    expectDatesToMatchUpToMinute(
      new Date(response.body.cooldown.from),
      getTime(trainingDate, 9, 30),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.cooldown.to),
      getTime(trainingDate, 9, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.warmup.from),
      getTime(
        trainingDate,
        8,
        0 - DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.warmup.to),
      getTime(trainingDate, 8, 0),
    );
    expect(response.body.components).toHaveLength(3);
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[0].from),
      getTime(trainingDate, 8, 0),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[0].to),
      getTime(trainingDate, 8, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[1].from),
      getTime(trainingDate, 8, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[1].to),
      getTime(trainingDate, 9, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[2].from),
      getTime(trainingDate, 9, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(response.body.components[2].to),
      getTime(trainingDate, 9, 30),
    );

    await db.trainings.delete(newTrainingId);
  });
});
