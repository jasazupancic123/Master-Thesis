import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { generateRandomNumber } from '@src/common/utils/random.util';
import type { Group } from '@src/institution/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { UpdateManyWorkloadsDto } from '@src/training/dto/update-many-workloads.dto';
import type { Training } from '@src/training/entity/training.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';
import { generateWorkloadStub } from '@src/training/mock/workload.stub';
import { WorkloadService } from '@src/training/service/workload.service';

describe('Update Many Workloads E2E', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let workloadService: WorkloadService;

  // first institution
  let institution: TestInstitution;
  let otherInstitution: TestInstitution;
  let group: Group;
  let training: Training;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    workloadService = testApp.module.get(WorkloadService);

    const athletes = await Promise.all([
      testApp.auth.createAthlete('a1'),
      testApp.auth.createAthlete('a2'),
      testApp.auth.createAthlete('a3'),
    ]);

    otherInstitution = await db.institutions.createTest({ random: true });
    institution = await db.institutions.createTest({ athletes });
    group = await db.groups.createTest(institution);
    training = await db.trainings.createTest(group, {
      cycleId: group.cycles[1].id,
      components: [
        generateTrainingComponent({
          id: 'c1',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({
                  id: 'e1',
                  sets: [
                    generateExerciseSet(1, { reps: 10, loadKg: 60 }),
                    generateExerciseSet(2, { reps: 8, loadKg: 70 }),
                    generateExerciseSet(3, { reps: 6, loadKg: 80 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    // create 3 workloads for each athlete
    for (const athlete of athletes)
      await db.workloads.createMany([
        generateWorkloadStub({
          institutionId: institution.id,
          userId: athlete.uid,
          componentId: 'c1',
          trainingId: training.id,
          exerciseId: 'e1',
          supersetIndex: 0,
          prescribed: {},
          setNumber: 1,
          status: SetStatus.COMPLETED,
          reps: generateRandomNumber(8, 12),
          loadKg: generateRandomNumber(55, 75),
        }),
        generateWorkloadStub({
          institutionId: institution.id,
          userId: athlete.uid,
          componentId: 'c1',
          trainingId: training.id,
          exerciseId: 'e1',
          supersetIndex: 0,
          prescribed: {},
          setNumber: 2,
          status: SetStatus.COMPLETED,
          reps: generateRandomNumber(8, 12),
          loadKg: generateRandomNumber(55, 75),
        }),
        generateWorkloadStub({
          institutionId: institution.id,
          userId: athlete.uid,
          componentId: 'c1',
          trainingId: training.id,
          exerciseId: 'e1',
          supersetIndex: 0,
          prescribed: {},
          setNumber: 3,
          status: SetStatus.COMPLETED,
          reps: generateRandomNumber(8, 12),
          loadKg: generateRandomNumber(55, 75),
        }),
      ]);
  });

  afterAll(async () => {
    await db.institutions.deleteTest(otherInstitution.id);
    await db.institutions.deleteTest(institution.id);
    await db.clear();
    await testApp.close();
  });

  async function req(
    token: string,
    trainingId: string,
    body: UpdateManyWorkloadsDto,
  ) {
    return await testApp.http.patch(
      `/training/${trainingId}/workload/many`,
      token,
      body,
    );
  }

  it('should throw error if training does not exist', async () => {
    const res = await req(global.trainer.token, 'invalid-training-id', {
      updates: [],
      deletes: [],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training not found');
  });

  it('should not allow updating workloads for training from another institution', async () => {
    const res = await req(otherInstitution.trainers[0].token, training.id, {
      updates: [],
      deletes: [],
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this institution');
  });

  it('should not allow updating workload for athlete from another institution', async () => {
    const res = await req(otherInstitution.athletes[0].token, training.id, {
      updates: [],
      deletes: [],
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this institution');
  });

  it('should not throw error for trainer in the same institution', async () => {
    const res = await req(global.trainer.token, training.id, {
      updates: [],
      deletes: [],
    });

    expect(res.status).toBe(200);
  });

  it('should not throw error for athlete in the same institution', async () => {
    const res = await req(institution.athletes[0].token, training.id, {
      updates: [],
      deletes: [],
    });

    expect(res.status).toBe(200);
  });

  it('should update only athlete own workloads when athlete requests', async () => {
    const athlete = institution.athletes[0];

    const spy = jest.spyOn(workloadService, 'findAllByUserTraining');
    const res = await req(athlete.token, training.id, {
      updates: [],
      deletes: [],
    });

    expect(res.status).toBe(200);

    const workloads = await spy.mock.results[0].value;
    expect(workloads).toHaveLength(3);
    for (const workload of workloads) expect(workload.userId).toBe(athlete.uid);

    spy.mockClear();
  });

  it('should update all workloads when trainer requests', async () => {
    const spy = jest.spyOn(workloadService, 'findAllByUserTraining');
    const res = await req(global.trainer.token, training.id, {
      updates: [],
      deletes: [],
    });

    expect(res.status).toBe(200);

    const workloads = await spy.mock.results[0].value;
    expect(workloads).toHaveLength(9);
    spy.mockClear();
  });

  it('should throw error if workload not found in training', async () => {
    const res = await req(global.trainer.token, training.id, {
      updates: [
        {
          ref: {
            trainingId: training.id,
            componentId: 'c1',
            exerciseId: 'e1',
            setNumber: 1,
            supersetIndex: 1,
            userId: 'a1',
          },
          data: { reps: 15 },
        },
      ],
      deletes: [
        {
          trainingId: training.id,
          componentId: 'c1',
          exerciseId: 'e1',
          setNumber: 1,
          supersetIndex: 1,
          userId: 'a2',
        },
      ],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('NOT_FOUND');
  });

  it('should update and delete workloads successfully', async () => {
    const workloadsBefore = await db.workloads.getAll(training.id);
    expect(workloadsBefore).toHaveLength(9);

    const prevUpdatedWorkload = workloadsBefore.find((wl) =>
      wl.id.startsWith(`${training.id}-a1-c1-e1-0-1`),
    );
    expect(prevUpdatedWorkload).toBeDefined();

    const prevDeletedWorkload = workloadsBefore.find((wl) =>
      wl.id.startsWith(`${training.id}-a2-c1-e1-0-3`),
    );
    expect(prevDeletedWorkload).toBeDefined();

    const res = await req(global.trainer.token, training.id, {
      updates: [
        {
          ref: {
            trainingId: training.id,
            componentId: 'c1',
            exerciseId: 'e1',
            setNumber: 1,
            supersetIndex: 0,
            userId: 'a1',
          },
          data: { reps: 15 },
        },
      ],
      deletes: [
        {
          trainingId: training.id,
          componentId: 'c1',
          exerciseId: 'e1',
          setNumber: 3,
          supersetIndex: 0,
          userId: 'a2',
        },
      ],
    });

    expect(res.status).toBe(200);

    // find updated workloads and verify
    const workloadsAfter = await db.workloads.getAll(training.id);
    expect(workloadsAfter).toHaveLength(8); // 1 deleted, 1 updated

    const a1PrevTotalReps = workloadsBefore
      .filter((wl) => wl.userId === 'a1')
      .reduce((sum, wl) => sum + (wl.reps || 0), 0);

    const a1NewTotalReps = workloadsAfter
      .filter((wl) => wl.userId === 'a1')
      .reduce((sum, wl) => sum + (wl.reps || 0), 0);

    expect(a1NewTotalReps).toBeGreaterThan(a1PrevTotalReps);

    const updatedWorkload = workloadsAfter.find((wl) =>
      wl.id.startsWith(`${training.id}-a1-c1-e1-0-1`),
    );
    expect(updatedWorkload).toBeDefined();
    expect(updatedWorkload?.reps).toBe(15);
    expect(updatedWorkload?.loadKg).toBe(prevUpdatedWorkload?.loadKg); // unchanged

    const deletedWorkload = workloadsAfter.find((wl) =>
      wl.id.startsWith(`${training.id}-a2-c1-e1-0-3`),
    );
    expect(deletedWorkload).toBeUndefined();

    // check statuses
    const a1StatusAfter = await db.trainingComponentUserStatus.findById({
      trainingId: training.id,
      componentId: 'c1',
      uid: 'a1',
    });

    // a1 status reps
    expect(a1StatusAfter?.reps).toBe(a1NewTotalReps);
    expect(a1StatusAfter?.sets).toBe(3);

    // a2 status reps
    const a2StatusAfter = await db.trainingComponentUserStatus.findById({
      trainingId: training.id,
      componentId: 'c1',
      uid: 'a2',
    });

    const a2PrevTotalReps = workloadsBefore
      .filter((wl) => wl.userId === 'a2')
      .reduce((sum, wl) => sum + (wl.reps || 0), 0);

    const a2NewTotalReps = workloadsAfter
      .filter((wl) => wl.userId === 'a2')
      .reduce((sum, wl) => sum + (wl.reps || 0), 0);

    expect(a2NewTotalReps).toBeLessThan(a2PrevTotalReps);
    expect(a2StatusAfter?.reps).toBe(a2NewTotalReps);
    expect(a2StatusAfter?.sets).toBe(2); // one set deleted
  });
});
