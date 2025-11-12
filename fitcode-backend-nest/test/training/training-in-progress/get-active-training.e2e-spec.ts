import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { getTime } from '@src/common/utils/date.util';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import type { Workload } from '@src/training/entity/workload.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';

describe('Get Active Training (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  beforeAll(async () => {
    testApp = await TestApp.init();

    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);
    training = await db.trainings.createTest(group, {
      components: [
        generateTrainingComponent({
          id: 'c1',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({
                  id: 'e1',
                  sets: [
                    generateExerciseSet(1),
                    generateExerciseSet(2),
                    generateExerciseSet(3),
                  ],
                }),
              ],
            }),
          ],
        }),
        generateTrainingComponent({
          id: 'c2',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({
                  id: 'e2',
                  sets: [
                    generateExerciseSet(1),
                    generateExerciseSet(2),
                    generateExerciseSet(3),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  afterAll(async () => {
    await db.institutions.remove(institution.id);
    await db.clear();
  });

  async function startReq(
    token: string,
    trainingId: string,
    componentId: string,
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/component/${componentId}/start`,
      token,
      {},
    );
  }

  async function req(token: string) {
    return await testApp.http.get(`/training/get/active`, token);
  }

  it('should return null if there is no active training for athlete', async () => {
    const res = await req(global.athlete.token);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('should return active training for athlete', async () => {
    await startReq(global.athlete.token, training.id, 'c1');

    const res = await req(global.athlete.token);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(training.id);
    expect(res.body.workloads).toBeDefined();
    expect(res.body.statuses).toBeDefined();

    // clean up
    await db.trainingComponentUserStatus.deleteAllByTraining(training.id);
  });

  it('should return active training for athlete with populated workloads', async () => {
    await startReq(global.athlete.token, training.id, 'c1');

    const res = await req(global.athlete.token);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(training.id);
    expect(res.body.workloads).toBeDefined();
    expect(res.body.statuses).toBeDefined();

    await db.workloads.createMany([
      {
        trainingId: training.id,
        userId: global.athlete.uid,
        componentId: 'c1',
        supersetIndex: 0,
        exerciseId: 'e1',
        setNumber: 1,
        status: SetStatus.PARTIAL,
        prescribed: { reps: 10, loadKg: 50 },
        reps: 13,
        loadKg: 37.5,
        rir: 5,
        photoURLs: ['a', 'b', 'c'],
      },
    ]);

    const resWithWorkloads = await req(global.athlete.token);
    expect(resWithWorkloads.status).toBe(200);
    expect(resWithWorkloads.body.id).toBe(training.id);
    expect(resWithWorkloads.body.workloads).toBeDefined();
    expect(resWithWorkloads.body.statuses).toBeDefined();

    const resTraining = resWithWorkloads.body as Training & {
      workloads: Workload[];
    };

    expect(resTraining.workloads).toHaveLength(1);
    const firstSet =
      resTraining.components[0].supersets[0].exercises[0].sets[0];

    expect(firstSet.reps).toBe(13);
    expect(firstSet.loadKg).toBe(37.5);

    // clean up
    await db.trainingComponentUserStatus.deleteAllByTraining(training.id);
    await db.workloads.deleteAll(training.id);
  });

  it('should return active training even if multiple components are in progress', async () => {
    await startReq(global.athlete.token, training.id, 'c1');
    await startReq(global.athlete.token, training.id, 'c2');

    const res = await req(global.athlete.token);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(training.id);
    expect(res.body.workloads).toBeDefined();
    expect(res.body.statuses).toBeDefined();

    // clean up
    await db.trainingComponentUserStatus.deleteAllByTraining(training.id);
  });

  it('should return first active training if multiple trainings are in progress', async () => {
    const earliestTraining = await db.trainings.createTest(group, {
      components: [generateTrainingComponent({ id: 'c1' })],
    });

    // create 2 reports in db
    await db.trainingComponentUserStatus.save(
      {
        id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        trainingId: earliestTraining.id,
        componentId: 'c1',
        userId: global.athlete.uid,
        status: TrainingStatus.IN_PROGRESS,
        from: getTime(new Date(), 5, 0),
      },
      {
        trainingId: earliestTraining.id,
        uid: global.athlete.uid,
        componentId: 'c1',
      },
    );

    await db.trainingComponentUserStatus.save(
      {
        id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        trainingId: earliestTraining.id,
        componentId: 'c1',
        userId: global.athlete.uid,
        status: TrainingStatus.IN_PROGRESS,
        from: getTime(new Date(), 10, 0),
      },
      { trainingId: training.id, uid: global.athlete.uid, componentId: 'c1' },
    );

    // 2 reports should be in db
    const reports = await db.trainingComponentUserStatus.getAllByTraining(
      earliestTraining.id,
    );
    expect(reports).toHaveLength(1);

    const reports2 = await db.trainingComponentUserStatus.getAllByTraining(
      training.id,
    );
    expect(reports2).toHaveLength(1);

    const res = await req(global.athlete.token);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(earliestTraining.id);
    expect(res.body.workloads).toBeDefined();
    expect(res.body.statuses).toBeDefined();

    // clean up
    await db.trainingComponentUserStatus.deleteAllByTraining(training.id);
    await db.trainingComponentUserStatus.deleteAllByTraining(
      earliestTraining.id,
    );
    await db.trainings.delete(earliestTraining.id);
  });
});
