import { TestApp } from '@test/common/utils/app.util';
import { addSeconds } from 'date-fns';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { WorkloadRef } from '@src/common/type/firestore.type';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/institution/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import { TrainingStatus } from '@src/training/enum/training-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({ field: 'c1' });
  const c2 = generateComponentStub({ field: 'c2' });

  return { Components: [c1, c2] };
});

describe('Complete Next Set (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let trainingService: TrainingService;

  let institution: TestInstitution;
  let group: Group;
  let trainingId: string;

  const firstSetCompletion = new Date();
  const lastSetCompletion = addSeconds(firstSetCompletion, 20);

  beforeAll(async () => {
    testApp = await TestApp.init();
    trainingService = testApp.module.get(TrainingService);
    const exerciseService = testApp.module.get(ExerciseService);

    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);

    await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ name: 'squat', components: ['c1'] }),
      generateExerciseStub({ name: 'bench', components: ['c1'] }),
      generateExerciseStub({ name: 'deadlift', components: ['c1'] }),
    ]);

    trainingId = await db.trainings.save(
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        ownerId: global.trainer.uid,
        membersIds: institution.athletes.map((a) => a.uid),
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(3, { reps: 10, loadKg: 50 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'bench',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                    ],
                  }),
                ],
              }),
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(3, { reps: 10, loadKg: 50 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    // start training component
    await db.trainingComponentUserStatus.createTest(
      trainingId,
      'c1',
      global.athlete.uid,
      { status: TrainingStatus.IN_PROGRESS },
    );
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  function ref(
    supersetIndex: number,
    exerciseId: string,
    setNumber: number,
  ): WorkloadRef {
    return {
      userId: global.athlete.uid,
      trainingId,
      componentId: 'c1',
      supersetIndex,
      exerciseId,
      setNumber,
    };
  }

  it('should save first set with recovery time 0', async () => {
    await trainingService.upsertSet(global.trainer, ref(0, 'squat', 1), {
      userId: global.athlete.uid,
      from: firstSetCompletion,
      to: lastSetCompletion,
      reps: 10,
      loadKg: 50,
    });

    const workloads = await db.workloads.getAll(trainingId);
    expect(workloads).toHaveLength(1);
    expect(workloads[0].recTime).toBe(0);
    expect(workloads[0].recTimeR).toBeUndefined();
  });

  it('should save second set with recovery time 0 and update previous set recovery time', async () => {
    await trainingService.upsertSet(global.trainer, ref(0, 'squat', 2), {
      userId: global.athlete.uid,
      from: addSeconds(lastSetCompletion, 75), // 75 seconds rest
      to: addSeconds(lastSetCompletion, 100),
      reps: 10,
      loadKg: 50,
    });

    const workloads = (await db.workloads.getAll(trainingId)).sort(
      (a, b) => a.setNumber! - b.setNumber!,
    );

    expect(workloads).toHaveLength(2);

    const firstSet = workloads[0];
    expect(firstSet.recTime).toBe(75); // new updated rest time
    expect(firstSet.recTimeR).toBeUndefined();

    const secondSet = workloads[1];
    expect(secondSet.recTime).toBe(0);
    expect(secondSet.recTimeR).toBeUndefined();
  });

  it('should save third set with recovery time 90 and update previous set recovery time', async () => {
    await trainingService.upsertSet(global.trainer, ref(0, 'squat', 3), {
      userId: global.athlete.uid,
      from: addSeconds(lastSetCompletion, 200), // 100 seconds rest
      to: addSeconds(lastSetCompletion, 230),
      reps: 10,
      loadKg: 50,
    });

    const workloads = (await db.workloads.getAll(trainingId)).sort(
      (a, b) => a.setNumber! - b.setNumber!,
    );

    expect(workloads).toHaveLength(3);
    const secondSet = workloads[1];
    expect(secondSet.recTime).toBe(100);
    expect(secondSet.recTimeR).toBeUndefined();

    const thirdSet = workloads[2];
    expect(thirdSet.recTime).toBe(0);
    expect(thirdSet.recTimeR).toBeUndefined();
  });

  it('should save first set of another exercise with recovery time 0', async () => {
    await trainingService.upsertSet(global.trainer, ref(0, 'bench', 1), {
      userId: global.athlete.uid,
      from: addSeconds(lastSetCompletion, 300),
      to: addSeconds(lastSetCompletion, 320),
      reps: 10,
      loadKg: 50,
    });

    const workloads = await db.workloads.getAll(trainingId);
    expect(workloads).toHaveLength(4);

    const benchWorkloads = workloads.find(
      (w) => w.exerciseId === 'bench' && w.setNumber === 1,
    );
    expect(benchWorkloads.recTime).toBe(0);
    expect(benchWorkloads.recTimeR).toBeUndefined();

    // it should not affect squat workloads
    const squatWorkloads = workloads
      .filter((w) => w.exerciseId === 'squat')
      .sort((a, b) => a.setNumber! - b.setNumber!);

    expect(squatWorkloads).toHaveLength(3);
    expect(squatWorkloads[0].recTime).toBe(75);
    expect(squatWorkloads[1].recTime).toBe(100);
    expect(squatWorkloads[2].recTime).toBe(0);
  });

  it('should save squat from another superset with recovery time 0 and not affect any other sets', async () => {
    await trainingService.upsertSet(global.trainer, ref(1, 'squat', 1), {
      userId: global.athlete.uid,
      from: addSeconds(lastSetCompletion, 400),
      to: addSeconds(lastSetCompletion, 420),
      reps: 10,
      loadKg: 50,
    });

    const workloads = await db.workloads.getAll(trainingId);
    expect(workloads).toHaveLength(5);

    const squatWorkloads = workloads
      .filter((w) => w.exerciseId === 'squat' && w.supersetIndex === 1)
      .sort((a, b) => a.setNumber! - b.setNumber!);

    expect(squatWorkloads).toHaveLength(1);
    expect(squatWorkloads[0].recTime).toBe(0);
    expect(squatWorkloads[0].recTimeR).toBeUndefined();

    const allSquatWorkloads = workloads
      .filter((w) => w.exerciseId === 'squat' && w.supersetIndex === 0)
      .sort((a, b) => a.setNumber! - b.setNumber!);

    expect(allSquatWorkloads).toHaveLength(3);
    expect(allSquatWorkloads[0].recTime).toBe(75);
    expect(allSquatWorkloads[1].recTime).toBe(100);
    expect(allSquatWorkloads[2].recTime).toBe(0);
  });

  it('should save second set of squat in other superset correctly', async () => {
    await trainingService.upsertSet(global.trainer, ref(1, 'squat', 2), {
      userId: global.athlete.uid,
      from: addSeconds(lastSetCompletion, 500), // 80 seconds rest
      to: addSeconds(lastSetCompletion, 530),
      reps: 10,
      loadKg: 50,
    });

    const workloads = await db.workloads.getAll(trainingId);
    expect(workloads).toHaveLength(6);

    // shoud
    const squatWorkloadsSuperset0 = workloads
      .filter((w) => w.exerciseId === 'squat' && w.supersetIndex === 0)
      .sort((a, b) => a.setNumber! - b.setNumber!);

    expect(squatWorkloadsSuperset0).toHaveLength(3);
    expect(squatWorkloadsSuperset0[0].recTime).toBe(75);
    expect(squatWorkloadsSuperset0[1].recTime).toBe(100);
    expect(squatWorkloadsSuperset0[2].recTime).toBe(0);

    const squatWorkloadsSuperset1 = workloads
      .filter((w) => w.exerciseId === 'squat' && w.supersetIndex === 1)
      .sort((a, b) => a.setNumber! - b.setNumber!);

    expect(squatWorkloadsSuperset1).toHaveLength(2);
    expect(squatWorkloadsSuperset1[0].recTime).toBe(80);
    expect(squatWorkloadsSuperset1[1].recTime).toBe(0);
  });
});
