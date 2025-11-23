import { TestApp } from '@test/common/utils/app.util';
import { expectDatesToMatchUpToMinute } from '@test/common/utils/date.util';
import { addDays, startOfDay, subDays } from 'date-fns';

import type { DateRangeDto } from '@src/common/dto/date-range.dto';
import { getTime } from '@src/common/service/util';
import type { TestInstitution } from '@src/common/type/entity.type';
import type { Group } from '@src/institution/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import {
  generateTrainingComponent,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({ field: 'c1' });
  const c2 = generateComponentStub({ field: 'c2' });
  const c3 = generateComponentStub({ field: 'c3' });

  return { Components: [c1, c2, c3] };
});

describe('Update Training (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;
  let trainingId: string;

  const trainingDate = getTime(addDays(new Date(), 2), 8, 0); // 2 days in the future, 8:00 AM

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

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
        components: [generateTrainingComponent({ id: 'c1' })],
      }),
    );
  });

  afterAll(async () => {
    await db.trainings.delete(trainingId);
    await db.institutions.remove(institution.id);
    await db.groups.delete({
      institutionId: institution.id,
      groupId: group.id,
    });
    await testApp.close();
  });

  async function req(
    body: DateRangeDto,
    _trainingId = trainingId,
    _componentId = 'c1',
    token: string = global.trainer.token,
  ) {
    return await testApp.http.patch(
      `/training/${_trainingId}/component/${_componentId}/time`,
      token,
      body,
    );
  }

  it('should fail if trainer that is not in group trainers tries to update training', async () => {
    const institution2 = await db.institutions.createTest({ random: true });
    const response = await req(
      { from: new Date(), to: new Date() },
      trainingId,
      'c1',
      institution2.trainers[0].token,
    );

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('You cannot view this institution');

    await db.institutions.remove(institution2.id);
  });

  it('should fail if component is invalid', async () => {
    const response = await req(
      { from: new Date(), to: new Date() },
      trainingId,
      'invalid-id',
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Training component not found');
  });

  it('should fail to update training if training is in the past', async () => {
    const pastTrainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [],
        from: subDays(getTime(new Date(), 8, 0), 1),
        to: subDays(getTime(new Date(), 9, 0), 1),
        components: [generateTrainingComponent({ id: 'c1' })],
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
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        from: getTime(in3Days, 9, 30),
        to: getTime(in3Days, 10, 30),
        components: [generateTrainingComponent({ id: 'c1' })],
      }),
    );

    const newTrainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [],
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        from: getTime(in3Days, 11, 0),
        to: getTime(in3Days, 12, 0),
        components: [generateTrainingComponent({ id: 'c1' })],
      }),
    );

    const response = await req(
      { from: getTime(in3Days, 10, 15), to: getTime(in3Days, 11, 15) },
      newTrainingId,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Training overlaps with other training');

    await db.trainings.delete(prevTrainingId);
    await db.trainings.delete(newTrainingId);
  });

  it('should throw error if new `to` extends beyond next components `to`', async () => {
    const trainingDate = addDays(startOfDay(new Date()), 4);
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
              id: 'c1',
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: 'c2',
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
      'c1',
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Cannot extend time beyond the next component',
    );

    await db.trainings.delete(newTrainingId);
  });

  it('should throw error if new `from` is before previous components `from`', async () => {
    const trainingDate = addDays(startOfDay(new Date()), 4);
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
              id: 'c1',
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: 'c2',
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
      'c2',
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Cannot move start time before the previous component',
    );

    await db.trainings.delete(newTrainingId);
  });

  it('should successfully update first component', async () => {
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
          to: getTime(trainingDate, 9, 0),
          components: [
            generateTrainingComponent({
              id: 'c1',
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: 'c2',
              from: getTime(trainingDate, 8, 30),
              to: getTime(trainingDate, 9, 0),
            }),
          ],
        },
        { disableAutomaticallySetComponentsDates: true },
      ),
    );

    const response = await req(
      { from: getTime(trainingDate, 8, 15), to: getTime(trainingDate, 8, 45) },
      newTrainingId,
      'c1',
    );

    expect(response.status).toBe(200);

    const t = await db.trainings.findById(newTrainingId);
    expectDatesToMatchUpToMinute(
      new Date(t.from),
      getTime(trainingDate, 8, 15),
    );
    expect(t.components).toHaveLength(2);
    expectDatesToMatchUpToMinute(
      new Date(t.components[0].from),
      getTime(trainingDate, 8, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[0].to),
      getTime(trainingDate, 8, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[1].from),
      getTime(trainingDate, 8, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[1].to),
      getTime(trainingDate, 9, 0),
    );
    expectDatesToMatchUpToMinute(new Date(t.to), getTime(trainingDate, 9, 0));

    await db.trainings.delete(newTrainingId);
  });

  it('should successfully update last component', async () => {
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
          to: getTime(trainingDate, 9, 0),
          components: [
            generateTrainingComponent({
              id: 'c1',
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: 'c2',
              from: getTime(trainingDate, 8, 30),
              to: getTime(trainingDate, 9, 0),
            }),
          ],
        },
        { disableAutomaticallySetComponentsDates: true },
      ),
    );

    const response = await req(
      { from: getTime(trainingDate, 8, 15), to: getTime(trainingDate, 9, 15) },
      newTrainingId,
      'c2',
    );

    expect(response.status).toBe(200);

    const t = await db.trainings.findById(newTrainingId);
    expectDatesToMatchUpToMinute(new Date(t.to), getTime(trainingDate, 9, 15));
    expect(t.components).toHaveLength(2);
    expectDatesToMatchUpToMinute(
      new Date(t.components[0].from),
      getTime(trainingDate, 8, 0),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[0].to),
      getTime(trainingDate, 8, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[1].from),
      getTime(trainingDate, 8, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[1].to),
      getTime(trainingDate, 9, 15),
    );
    expectDatesToMatchUpToMinute(new Date(t.from), getTime(trainingDate, 8, 0));

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
          to: getTime(trainingDate, 9, 30),
          components: [
            generateTrainingComponent({
              id: 'c1',
              from: getTime(trainingDate, 8, 0),
              to: getTime(trainingDate, 8, 30),
            }),
            generateTrainingComponent({
              id: 'c2',
              from: getTime(trainingDate, 8, 30),
              to: getTime(trainingDate, 9, 0),
            }),
            generateTrainingComponent({
              id: 'c3',
              from: getTime(trainingDate, 9, 0),
              to: getTime(trainingDate, 9, 30),
            }),
          ],
        },
        { disableAutomaticallySetComponentsDates: true },
      ),
    );

    const response = await req(
      { from: getTime(trainingDate, 8, 45), to: getTime(trainingDate, 9, 15) },
      newTrainingId,
      'c2',
    );

    expect(response.status).toBe(200);

    const t = await db.trainings.findById(newTrainingId);
    expectDatesToMatchUpToMinute(new Date(t.to), getTime(trainingDate, 9, 30));
    expectDatesToMatchUpToMinute(new Date(t.from), getTime(trainingDate, 8, 0));
    expect(t.components).toHaveLength(3);
    expectDatesToMatchUpToMinute(
      new Date(t.components[0].from),
      getTime(trainingDate, 8, 0),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[0].to),
      getTime(trainingDate, 8, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[1].from),
      getTime(trainingDate, 8, 45),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[1].to),
      getTime(trainingDate, 9, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[2].from),
      getTime(trainingDate, 9, 15),
    );
    expectDatesToMatchUpToMinute(
      new Date(t.components[2].to),
      getTime(trainingDate, 9, 30),
    );

    await db.trainings.delete(newTrainingId);
  });
});
